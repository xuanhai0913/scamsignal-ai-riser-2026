import {
  ANALYZE_V1_PATH,
  parseAnalysisResponseV1,
  parseApiErrorResponseV1,
} from '@scamsignal/core/api-contract';
import {
  CAPABILITIES_V1_PATH,
  parseCapabilitiesResponseV1,
} from '@scamsignal/core/capabilities';
import type {
  Analysis,
  AnalysisRequestV1,
  ApiErrorCode,
  CapabilitiesResponseV1,
} from '@scamsignal/core';

type FetchLike = typeof fetch;

export type ScamSignalApiClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: FetchLike;
};

export type AnalyzeCallOptions = {
  signal?: AbortSignal;
  requestId?: string;
};

export class ApiTransportError extends TypeError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiTransportError';
  }
}

export class ScamSignalApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly requestId?: string;

  constructor(options: {
    code: ApiErrorCode;
    message: string;
    status: number;
    retryable: boolean;
    requestId?: string;
    cause?: unknown;
  }) {
    super(options.message, {cause: options.cause});
    this.name = 'ScamSignalApiError';
    this.code = options.code;
    this.status = options.status;
    this.retryable = options.retryable;
    this.requestId = options.requestId;
  }
}

function endpoint(baseUrl: string, path: string) {
  const normalized = baseUrl.trim().replace(/\/+$/u, '');
  return normalized ? `${normalized}${path}` : path;
}

export function createScamSignalApiClient(options: ScamSignalApiClientOptions = {}) {
  const fetcher = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const baseUrl = options.baseUrl ?? '';
  const analyzeEndpoint = endpoint(baseUrl, ANALYZE_V1_PATH);
  const capabilitiesEndpoint = endpoint(baseUrl, CAPABILITIES_V1_PATH);
  const pingEndpoint = endpoint(baseUrl, '/api/ping');

  if (!fetcher) throw new Error('Runtime không hỗ trợ fetch.');

  return {
    async ping(signal?: AbortSignal): Promise<void> {
      const controller = new AbortController();
      const onExternalAbort = () => controller.abort(signal?.reason);
      signal?.addEventListener('abort', onExternalAbort, {once: true});
      if (signal?.aborted) onExternalAbort();
      const timer = setTimeout(() => controller.abort(new Error('request_timeout')), Math.min(timeoutMs, 5_000));

      try {
        const response = await fetcher(pingEndpoint, {
          method: 'POST',
          headers: {'Accept': 'application/json'},
          signal: controller.signal,
        });
        if (!response.ok || !(response.headers.get('content-type') ?? '').includes('application/json')) {
          throw new ApiTransportError('Kênh phân tích hiện không khả dụng.');
        }
        const payload = await response.json() as {status?: unknown; service?: unknown};
        if (payload.status !== 'ok' || payload.service !== 'scamsignal-ai') {
          throw new ApiTransportError('Kênh phân tích trả về phản hồi không hợp lệ.');
        }
      } catch (error) {
        if (error instanceof ApiTransportError) throw error;
        throw new ApiTransportError('Không thể kết nối kênh phân tích.', {cause: error});
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onExternalAbort);
      }
    },
    async getCapabilities(signal?: AbortSignal): Promise<CapabilitiesResponseV1> {
      const controller = new AbortController();
      const onExternalAbort = () => controller.abort(signal?.reason);
      signal?.addEventListener('abort', onExternalAbort, {once: true});
      if (signal?.aborted) onExternalAbort();
      const timer = setTimeout(() => controller.abort(new Error('request_timeout')), Math.min(timeoutMs, 10_000));

      try {
        const response = await fetcher(capabilitiesEndpoint, {
          headers: {'Accept': 'application/json'},
          signal: controller.signal,
        });
        if (!response.ok || !(response.headers.get('content-type') ?? '').includes('application/json')) {
          throw new ApiTransportError('Không thể kiểm tra trạng thái dịch vụ.');
        }
        return parseCapabilitiesResponseV1(await response.json());
      } catch (error) {
        if (error instanceof ApiTransportError) throw error;
        throw new ApiTransportError('Không thể kiểm tra trạng thái dịch vụ.', {cause: error});
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onExternalAbort);
      }
    },
    async analyze(request: AnalysisRequestV1, callOptions: AnalyzeCallOptions = {}): Promise<Analysis> {
      const controller = new AbortController();
      const onExternalAbort = () => controller.abort(callOptions.signal?.reason);
      callOptions.signal?.addEventListener('abort', onExternalAbort, {once: true});
      if (callOptions.signal?.aborted) onExternalAbort();
      const timer = setTimeout(() => controller.abort(new Error('request_timeout')), timeoutMs);

      let response: Response;
      try {
        response = await fetcher(analyzeEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(callOptions.requestId ? {'X-Request-Id': callOptions.requestId} : {}),
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
      } catch (error) {
        throw new ApiTransportError('Không thể kết nối máy chủ phân tích.', {cause: error});
      } finally {
        clearTimeout(timer);
        callOptions.signal?.removeEventListener('abort', onExternalAbort);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new ApiTransportError('Máy chủ phân tích hiện không khả dụng.');
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error) {
        throw new ScamSignalApiError({
          code: 'INVALID_RESPONSE',
          message: 'Máy chủ trả về dữ liệu không hợp lệ.',
          status: response.status,
          retryable: true,
          cause: error,
        });
      }

      if (!response.ok) {
        const apiError = parseApiErrorResponseV1(payload);
        throw new ScamSignalApiError({
          code: apiError?.error.code ?? 'INTERNAL_ERROR',
          message: apiError?.error.message ?? 'Máy chủ chưa thể hoàn tất phân tích.',
          status: response.status,
          retryable: apiError?.error.retryable ?? response.status >= 500,
          requestId: apiError?.requestId ?? response.headers.get('x-request-id') ?? undefined,
        });
      }

      try {
        return parseAnalysisResponseV1(payload).analysis;
      } catch (error) {
        throw new ScamSignalApiError({
          code: 'INVALID_RESPONSE',
          message: 'Phản hồi phân tích không đúng contract v1.',
          status: response.status,
          retryable: false,
          cause: error,
        });
      }
    },
  };
}
