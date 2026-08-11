import {
  extractImageSignals,
  extractReferenceDomains,
  extractUrls,
  generateGeminiAnalysis,
  inspectUrls,
  parseAnalysisRequestV1,
  redactSensitiveText,
  resolveAppRuntime,
} from '../packages/core/src/index.js';
import type {Analysis} from '../packages/core/src/types.js';
import {enrichWithWebRisk} from './web-risk.js';

export async function analyzeRequest(input: unknown): Promise<Analysis> {
  const startedAt = Date.now();
  const request = parseAnalysisRequestV1(input);
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) throw new Error('Máy chủ chưa được cấu hình Gemini API key.');

  const messageRedaction = redactSensitiveText(request.message);
  const extraRedaction = redactSensitiveText(request.extraInfo);
  const redactedRequest = {
    ...request,
    message: messageRedaction.value,
    extraInfo: extraRedaction.value,
  };
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const extraction = request.imageDataUrl
    ? await extractImageSignals({apiKey, model, imageDataUrl: request.imageDataUrl})
    : {visibleText: '', urls: [], referenceDomains: []};

  const referenceDomains = [...new Set([
    ...extractReferenceDomains(`${redactedRequest.message}\n${redactedRequest.extraInfo}`),
    ...extraction.referenceDomains,
  ])].slice(0, 3);
  const urls = [...new Set([
    ...extractUrls(redactedRequest.message),
    ...extractUrls(redactedRequest.extraInfo),
    ...extractUrls(extraction.visibleText),
    ...extraction.urls,
  ])].slice(0, 5);
  const initialInspections = inspectUrls(urls, referenceDomains);
  const webRiskKey = process.env.WEB_RISK_API_KEY || '';
  const urlInspections = await enrichWithWebRisk(initialInspections, webRiskKey);
  const webRiskState = !webRiskKey
    ? 'not_configured'
    : urlInspections.some((item) => item.webRisk.status === 'error') ? 'partial_error' : 'checked';

  const analysis = await generateGeminiAnalysis({
    apiKey,
    model,
    request: redactedRequest,
    extractedImageText: extraction.visibleText,
    urlInspections,
    referenceDomains,
    pipeline: {
      model,
      backend: resolveAppRuntime(process.env),
      webRisk: webRiskState,
      redactionCount: messageRedaction.count + extraRedaction.count,
      durationMs: 0,
    },
  });

  return {
    ...analysis,
    pipeline: {...analysis.pipeline, durationMs: Date.now() - startedAt},
  };
}
