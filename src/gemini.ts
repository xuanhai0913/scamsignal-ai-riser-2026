import {
  ApiTransportError,
  createScamSignalApiClient,
  ScamSignalApiError,
} from '@scamsignal/api-client';
import {redactSensitiveText} from '@scamsignal/core/privacy';
import type {AnalyzeRequest} from '@scamsignal/core/types';

const apiClient = createScamSignalApiClient({
  baseUrl: (import.meta as ImportMeta & {env: Record<string, string | undefined>}).env.VITE_API_BASE_URL,
  // Image analysis performs a bounded OCR pass before the structured risk pass.
  // Each provider call has its own 25 s deadline, so the browser must allow the
  // complete two-stage pipeline to finish instead of aborting at 30 s.
  timeoutMs: 60_000,
});

type AnalyzeOptions = {
  preferLocal?: boolean;
};

async function analyzeLocally(
  request: AnalyzeRequest,
  redactionCount: number,
  startedAt: number,
) {
  const {analyzeDeterministically} = await import('@scamsignal/core/deterministic-analysis');
  return analyzeDeterministically(request, {redactionCount, startedAt});
}

export function getRedactionSummary(message: string, extraInfo: string) {
  const messageResult = redactSensitiveText(message);
  const extraResult = redactSensitiveText(extraInfo);
  return {
    count: messageResult.count + extraResult.count,
    kinds: [...new Set([...messageResult.kinds, ...extraResult.kinds])],
  };
}

export function getRuntimeCapabilities(signal?: AbortSignal) {
  return apiClient.getCapabilities(signal);
}

export function probeAnalysisTransport(signal?: AbortSignal) {
  return apiClient.ping(signal);
}

/**
 * Redact in the browser, then delegate the model call to the same-origin API.
 * Gemini credentials and provider calls must never be part of the web bundle.
 */
export async function analyzeWithGemini(input: AnalyzeRequest, options: AnalyzeOptions = {}) {
  const startedAt = Date.now();
  const messageResult = redactSensitiveText(input.message);
  const extraResult = redactSensitiveText(input.extraInfo);
  const safeRequest = {
    ...input,
    message: messageResult.value,
    extraInfo: extraResult.value,
  };
  const canRunLocalTextChecks = safeRequest.message.trim().length >= 16 && !safeRequest.imageDataUrl;
  const redactionCount = messageResult.count + extraResult.count;

  if (options.preferLocal && canRunLocalTextChecks) {
    return analyzeLocally(safeRequest, redactionCount, startedAt);
  }

  try {
    return await apiClient.analyze(safeRequest);
  } catch (error) {
    const retryableProviderFailure = error instanceof ScamSignalApiError && error.retryable;
    if ((error instanceof ApiTransportError || retryableProviderFailure) && canRunLocalTextChecks) {
      return analyzeLocally(safeRequest, redactionCount, startedAt);
    }
    throw error;
  }
}
