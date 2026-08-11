import {existsSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {config as loadEnvironment} from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import {
  ANALYZE_V1_PATH,
  ANALYZE_API_V1_PATH,
  ANALYZE_UNSCOPED_V1_PATH,
  ContractValidationError,
  createAnalysisResponseV1,
  createApiErrorResponseV1,
} from '../packages/core/src/api-contract.js';
import {
  CAPABILITIES_V1_PATH,
  createCapabilitiesResponseV1,
} from '../packages/core/src/capabilities.js';
import {analyzeRequest} from './analyze.js';

loadEnvironment({path: ['.env.local', '.env'], quiet: true});

const app = express();
const port = Number(process.env.PORT || 3000);
const distPath = existsSync(fileURLToPath(new URL('../../dist', import.meta.url)))
  ? fileURLToPath(new URL('../../dist', import.meta.url))
  : path.join(process.cwd(), 'dist');
const indexPath = existsSync(fileURLToPath(new URL('../../dist/index.html', import.meta.url)))
  ? fileURLToPath(new URL('../../dist/index.html', import.meta.url))
  : path.join(distPath, 'index.html');

app.disable('x-powered-by');
app.set('trust proxy', 1);
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    // Google AI Studio renders the shared Cloud Run service inside an iframe
    // from aistudio.google.com. Helmet's default X-Frame-Options: SAMEORIGIN
    // and frame-ancestors 'self' make that healthy service look like a failed
    // deployment to viewers, while direct navigation still works.
    frameguard: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        frameAncestors: ["'self'", 'https://aistudio.google.com'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
}
app.use(express.json({limit: '12mb'}));
app.use((request, response, next) => {
  const suppliedRequestId = request.get('x-request-id');
  const requestId = suppliedRequestId && /^[a-zA-Z0-9._-]{8,100}$/u.test(suppliedRequestId)
    ? suppliedRequestId
    : randomUUID();
  response.locals.requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (request, response) => {
    const message = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
    if ([ANALYZE_V1_PATH, ANALYZE_API_V1_PATH, ANALYZE_UNSCOPED_V1_PATH].includes(request.path as typeof ANALYZE_V1_PATH)) {
      response.status(429).json(createApiErrorResponseV1({
        requestId: String(response.locals.requestId),
        code: 'RATE_LIMITED',
        message,
        retryable: true,
      }));
      return;
    }
    response.status(429).json({error: message});
  },
});

app.get('/health', (_request, response) => {
  response.json({status: 'ok', service: 'scamsignal-ai'});
});

app.get(CAPABILITIES_V1_PATH, (_request, response) => {
  response.setHeader('Cache-Control', 'private, max-age=30');
  response.json(createCapabilitiesResponseV1(process.env));
});

app.get('/api/status', (_request, response) => {
  const capabilities = createCapabilitiesResponseV1(process.env);
  response.json({
    gemini: ['available', 'configured'].includes(capabilities.analysis.state),
    webRisk: ['available', 'configured'].includes(capabilities.webRisk.state),
    runtime: capabilities.runtime,
  });
});

// Lightweight POST probe used by deployment health checks. It deliberately
// avoids provider calls so the platform can distinguish routing/runtime issues
// from Gemini availability.
app.post('/api/ping', apiLimiter, (_request, response) => {
  response.json({status: 'ok', service: 'scamsignal-ai'});
});

app.post([ANALYZE_V1_PATH, ANALYZE_API_V1_PATH, ANALYZE_UNSCOPED_V1_PATH], apiLimiter, async (request, response) => {
  try {
    const analysis = await analyzeRequest(request.body);
    response.json(createAnalysisResponseV1(analysis, String(response.locals.requestId)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể hoàn tất phân tích.';
    const clientError = error instanceof ContractValidationError;
    const providerTimeout = /timeout|timed out|quá thời gian/iu.test(message);
    response.status(clientError ? 400 : 503).json(createApiErrorResponseV1({
      requestId: String(response.locals.requestId),
      code: clientError ? 'INVALID_REQUEST' : providerTimeout ? 'PROVIDER_TIMEOUT' : 'MODEL_UNAVAILABLE',
      message,
      retryable: !clientError,
    }));
  }
});

if (process.env.NODE_ENV !== 'production') {
  const {createServer: createViteServer} = await import('vite');
  const vite = await createViteServer({
    server: {middlewareMode: true},
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  if (existsSync(distPath)) app.use(express.static(distPath, {index: false, maxAge: '1h'}));

  app.use((request, response) => {
    if (request.method === 'GET' && existsSync(indexPath)) {
      response.sendFile(indexPath);
      return;
    }
    response.status(404).json({error: 'Không tìm thấy tài nguyên.'});
  });
}

const server = app.listen(port, '0.0.0.0', () => {
  console.info(`ScamSignal AI listening on port ${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
