import {describe, expect, it, vi} from 'vitest';
import {
  ANALYSIS_API_VERSION,
  createAnalysisResponseV1,
  createApiErrorResponseV1,
} from '@scamsignal/core/api-contract';
import {createCapabilitiesResponseV1} from '@scamsignal/core/capabilities';
import {createAnalysisFixture} from '../../core/test/analysis-fixture.js';
import {createScamSignalApiClient, ScamSignalApiError} from './index.js';

const request = {
  message: 'Kiểm tra https://novabarnk.vn/secure giúp tôi.',
  extraInfo: 'Tên miền đối chiếu: novabank.vn',
};

describe('ScamSignal API client', () => {
  it('probes the same-origin POST ingress without calling the model', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({status: 'ok', service: 'scamsignal-ai'}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    })) as unknown as typeof fetch;
    const client = createScamSignalApiClient({baseUrl: 'https://api.example.test/', fetch: fetcher});

    await expect(client.ping()).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.example.test/api/ping',
      expect.objectContaining({method: 'POST', headers: {Accept: 'application/json'}}),
    );
  });

  it('rejects an HTML placeholder returned by a broken app ingress', async () => {
    const fetcher = vi.fn(async () => new Response('<html>Starting Server…</html>', {
      status: 200,
      headers: {'Content-Type': 'text/html'},
    })) as unknown as typeof fetch;
    const client = createScamSignalApiClient({fetch: fetcher});

    await expect(client.ping()).rejects.toMatchObject({
      name: 'ApiTransportError',
      message: 'Kênh phân tích hiện không khả dụng.',
    });
  });

  it('fetches and validates runtime capabilities without exposing configuration secrets', async () => {
    const responseBody = createCapabilitiesResponseV1({SCAMSIGNAL_RUNTIME: 'local'});
    const fetcher = vi.fn(async () => new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    })) as unknown as typeof fetch;
    const client = createScamSignalApiClient({baseUrl: 'https://api.example.test/', fetch: fetcher});

    await expect(client.getCapabilities()).resolves.toMatchObject({
      runtime: 'local',
      analysis: {state: 'not_configured'},
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.example.test/api/capabilities',
      expect.objectContaining({headers: {Accept: 'application/json'}}),
    );
  });

  it('calls the versioned endpoint and returns a validated analysis', async () => {
    const responseBody = createAnalysisResponseV1(createAnalysisFixture(), 'request-12345678');
    const fetcher = vi.fn(async () => new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    })) as unknown as typeof fetch;
    const client = createScamSignalApiClient({baseUrl: 'https://api.example.test/', fetch: fetcher});

    const analysis = await client.analyze(request, {requestId: 'client-request-123'});

    expect(analysis.score).toBe(92);
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetcher).mock.calls[0];
    expect(url).toBe('https://api.example.test/api/analyze');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['X-Request-Id']).toBe('client-request-123');
  });

  it('surfaces typed API errors with retry metadata', async () => {
    const responseBody = createApiErrorResponseV1({
      requestId: 'request-rate-limit',
      code: 'RATE_LIMITED',
      message: 'Thử lại sau.',
      retryable: true,
    });
    const fetcher = vi.fn(async () => new Response(JSON.stringify(responseBody), {
      status: 429,
      headers: {'Content-Type': 'application/json'},
    })) as unknown as typeof fetch;
    const client = createScamSignalApiClient({fetch: fetcher});

    const error = await client.analyze(request).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ScamSignalApiError);
    expect(error).toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
      retryable: true,
      requestId: 'request-rate-limit',
    });
  });

  it('rejects a successful response that does not match contract v1', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      apiVersion: ANALYSIS_API_VERSION,
      requestId: 'request-invalid-response',
      analysis: {score: 92},
    }), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    })) as unknown as typeof fetch;
    const client = createScamSignalApiClient({fetch: fetcher});

    await expect(client.analyze(request)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      retryable: false,
    });
  });
});
