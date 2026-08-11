import type {
  Analysis,
  AnalysisPipeline,
  AnalyzeRequest,
  Evidence,
  UrlInspection,
} from './types.js';

export const ANALYSIS_API_VERSION = 'v1' as const;
// AI Studio's imported-app runtime bridges this exact same-origin endpoint.
// The response still follows the v1 contract, while the server keeps the
// versioned aliases below for Cloud Run and existing external clients.
export const ANALYZE_V1_PATH = '/api/analyze' as const;
export const ANALYZE_API_V1_PATH = '/api/v1/analyses' as const;
export const ANALYZE_UNSCOPED_V1_PATH = '/v1/analyses' as const;
export const ANALYZE_LEGACY_PATH = '/api/analyze' as const;

export const ANALYSIS_REQUEST_LIMITS = {
  messageCharacters: 1_500,
  extraInfoCharacters: 300,
  imageDataUrlCharacters: 11_500_000,
  minimumTextCharacters: 16,
} as const;

export type AnalysisApiVersion = typeof ANALYSIS_API_VERSION;

export type AnalysisRequestV1 = AnalyzeRequest;

export type AnalysisResponseV1 = {
  apiVersion: AnalysisApiVersion;
  requestId: string;
  analysis: Analysis;
};

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'MODEL_UNAVAILABLE'
  | 'PROVIDER_TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'INTERNAL_ERROR';

export type ApiErrorResponseV1 = {
  apiVersion: AnalysisApiVersion;
  requestId: string;
  error: {
    code: ApiErrorCode;
    message: string;
    retryable: boolean;
  };
};

export class ContractValidationError extends Error {
  readonly code = 'INVALID_REQUEST' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ContractValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertOnlyKeys(value: Record<string, unknown>, allowed: readonly string[], field: string) {
  const unknownKey = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknownKey) {
    throw new ContractValidationError(`Trường ${field}.${unknownKey} không được hỗ trợ.`);
  }
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ContractValidationError(`Trường ${field} không hợp lệ.`);
  }
  return value;
}

function assertStringArray(value: unknown, field: string) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new ContractValidationError(`Trường ${field} không hợp lệ.`);
  }
}

function assertBoundedNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new ContractValidationError(`Trường ${field} không hợp lệ.`);
  }
}

function assertOneOf<T extends string>(value: unknown, values: readonly T[], field: string): asserts value is T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new ContractValidationError(`Trường ${field} không hợp lệ.`);
  }
}

function assertEvidence(value: unknown, index: number): asserts value is Evidence {
  if (!isRecord(value)) throw new ContractValidationError(`Evidence ${index} không hợp lệ.`);
  requiredString(value.id, `evidence[${index}].id`);
  requiredString(value.label, `evidence[${index}].label`);
  if (typeof value.value !== 'string') {
    throw new ContractValidationError(`Trường evidence[${index}].value không hợp lệ.`);
  }
  requiredString(value.detail, `evidence[${index}].detail`);
  assertOneOf(value.severity, ['critical', 'warning', 'info'], `evidence[${index}].severity`);
  assertOneOf(value.source, ['deterministic', 'google_web_risk', 'gemini'], `evidence[${index}].source`);
  assertOneOf(value.verification, ['verified', 'inferred', 'unknown'], `evidence[${index}].verification`);
}

function assertUrlInspection(value: unknown, index: number): asserts value is UrlInspection {
  if (!isRecord(value)) throw new ContractValidationError(`URL inspection ${index} không hợp lệ.`);
  requiredString(value.input, `urlInspections[${index}].input`);
  requiredString(value.normalizedUrl, `urlInspections[${index}].normalizedUrl`);
  requiredString(value.hostname, `urlInspections[${index}].hostname`);
  requiredString(value.registrableDomain, `urlInspections[${index}].registrableDomain`);
  if (typeof value.subdomain !== 'string') {
    throw new ContractValidationError(`Trường urlInspections[${index}].subdomain không hợp lệ.`);
  }
  assertOneOf(
    value.structuralRisk,
    ['critical', 'suspicious', 'no_strong_signal'],
    `urlInspections[${index}].structuralRisk`,
  );
  if (!Array.isArray(value.findings)) {
    throw new ContractValidationError(`Trường urlInspections[${index}].findings không hợp lệ.`);
  }
  if (!isRecord(value.webRisk)) {
    throw new ContractValidationError(`Trường urlInspections[${index}].webRisk không hợp lệ.`);
  }
  assertOneOf(
    value.webRisk.status,
    ['threat', 'not_listed', 'not_configured', 'error'],
    `urlInspections[${index}].webRisk.status`,
  );
  assertStringArray(value.webRisk.threatTypes, `urlInspections[${index}].webRisk.threatTypes`);
}

function assertPipeline(value: unknown): asserts value is AnalysisPipeline {
  if (!isRecord(value)) throw new ContractValidationError('Trường pipeline không hợp lệ.');
  requiredString(value.model, 'pipeline.model');
  assertOneOf(value.backend, ['local', 'ai_studio', 'cloud_run'], 'pipeline.backend');
  assertOneOf(value.webRisk, ['checked', 'not_configured', 'partial_error'], 'pipeline.webRisk');
  if (typeof value.redactionCount !== 'number' || value.redactionCount < 0) {
    throw new ContractValidationError('Trường pipeline.redactionCount không hợp lệ.');
  }
  if (typeof value.durationMs !== 'number' || value.durationMs < 0) {
    throw new ContractValidationError('Trường pipeline.durationMs không hợp lệ.');
  }
}

function assertAnalysis(value: unknown): asserts value is Analysis {
  if (!isRecord(value)) throw new ContractValidationError('Trường analysis không hợp lệ.');
  assertBoundedNumber(value.score, 'analysis.score');
  assertBoundedNumber(value.confidence, 'analysis.confidence');
  assertOneOf(value.level, ['Nguy hiểm', 'Đáng ngờ', 'Ít rủi ro', 'Chưa đủ dữ kiện'], 'analysis.level');
  requiredString(value.summary, 'analysis.summary');
  if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
    throw new ContractValidationError('Trường analysis.evidence không hợp lệ.');
  }
  value.evidence.forEach(assertEvidence);
  assertStringArray(value.actions, 'analysis.actions');
  assertStringArray(value.missingInformation, 'analysis.missingInformation');
  assertStringArray(value.entities, 'analysis.entities');
  if (!Array.isArray(value.urlInspections)) {
    throw new ContractValidationError('Trường analysis.urlInspections không hợp lệ.');
  }
  value.urlInspections.forEach(assertUrlInspection);
  assertPipeline(value.pipeline);
}

export function parseAnalysisRequestV1(input: unknown): AnalysisRequestV1 {
  if (!isRecord(input)) throw new ContractValidationError('Yêu cầu phân tích không hợp lệ.');
  assertOnlyKeys(input, ['message', 'extraInfo', 'imageDataUrl'], 'request');

  const message = typeof input.message === 'string' ? input.message : '';
  const extraInfo = typeof input.extraInfo === 'string' ? input.extraInfo : '';
  const rawImageDataUrl = input.imageDataUrl;

  if (message.length > ANALYSIS_REQUEST_LIMITS.messageCharacters) {
    throw new ContractValidationError(
      `Nội dung vượt quá ${ANALYSIS_REQUEST_LIMITS.messageCharacters} ký tự.`,
    );
  }
  if (extraInfo.length > ANALYSIS_REQUEST_LIMITS.extraInfoCharacters) {
    throw new ContractValidationError(
      `Thông tin bổ sung vượt quá ${ANALYSIS_REQUEST_LIMITS.extraInfoCharacters} ký tự.`,
    );
  }
  if (rawImageDataUrl !== undefined && typeof rawImageDataUrl !== 'string') {
    throw new ContractValidationError('Dữ liệu ảnh không hợp lệ.');
  }
  const imageDataUrl = typeof rawImageDataUrl === 'string' ? rawImageDataUrl : undefined;
  if (typeof imageDataUrl === 'string') {
    if (imageDataUrl.length > ANALYSIS_REQUEST_LIMITS.imageDataUrlCharacters) {
      throw new ContractValidationError('Ảnh vượt quá giới hạn 8 MB.');
    }
    if (!/^data:image\/(?:png|jpeg|webp);base64,/u.test(imageDataUrl)) {
      throw new ContractValidationError('Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP.');
    }
  }
  if (message.trim().length < ANALYSIS_REQUEST_LIMITS.minimumTextCharacters && !imageDataUrl) {
    throw new ContractValidationError(
      `Hãy nhập ít nhất ${ANALYSIS_REQUEST_LIMITS.minimumTextCharacters} ký tự hoặc chọn một ảnh.`,
    );
  }

  return {message, extraInfo, imageDataUrl};
}

export function createAnalysisResponseV1(analysis: Analysis, requestId: string): AnalysisResponseV1 {
  return {apiVersion: ANALYSIS_API_VERSION, requestId, analysis};
}

export function createApiErrorResponseV1(options: {
  requestId: string;
  code: ApiErrorCode;
  message: string;
  retryable: boolean;
}): ApiErrorResponseV1 {
  return {
    apiVersion: ANALYSIS_API_VERSION,
    requestId: options.requestId,
    error: {
      code: options.code,
      message: options.message,
      retryable: options.retryable,
    },
  };
}

export function parseAnalysisResponseV1(input: unknown): AnalysisResponseV1 {
  if (!isRecord(input) || input.apiVersion !== ANALYSIS_API_VERSION) {
    throw new ContractValidationError('Phiên bản phản hồi API không hợp lệ.');
  }
  const requestId = requiredString(input.requestId, 'requestId');
  assertAnalysis(input.analysis);
  return {
    apiVersion: ANALYSIS_API_VERSION,
    requestId,
    analysis: input.analysis,
  };
}

export function parseApiErrorResponseV1(input: unknown): ApiErrorResponseV1 | undefined {
  if (!isRecord(input) || input.apiVersion !== ANALYSIS_API_VERSION || !isRecord(input.error)) {
    return undefined;
  }
  const codes: readonly ApiErrorCode[] = [
    'INVALID_REQUEST',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'RATE_LIMITED',
    'MODEL_UNAVAILABLE',
    'PROVIDER_TIMEOUT',
    'INVALID_RESPONSE',
    'INTERNAL_ERROR',
  ];
  if (
    typeof input.requestId !== 'string'
    || !input.requestId
    || typeof input.error.code !== 'string'
    || !codes.includes(input.error.code as ApiErrorCode)
    || typeof input.error.message !== 'string'
    || typeof input.error.retryable !== 'boolean'
  ) {
    return undefined;
  }
  return input as ApiErrorResponseV1;
}
