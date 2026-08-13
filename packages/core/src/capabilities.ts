export const CAPABILITIES_API_VERSION = 'v1' as const;
export const CAPABILITIES_V1_PATH = '/api/capabilities' as const;

export type AppRuntime = 'local' | 'ai_studio' | 'cloud_run';

export type CapabilityState =
  | 'available'
  | 'configured'
  | 'local_only'
  | 'not_configured'
  | 'temporarily_unavailable'
  | 'planned';

export type CapabilityStatus = {
  state: CapabilityState;
};

export type AnalysisCapabilityStatus = CapabilityStatus & {
  model?: string;
};

export type CapabilitiesResponseV1 = {
  apiVersion: typeof CAPABILITIES_API_VERSION;
  runtime: AppRuntime;
  checkedAt: string;
  analysis: AnalysisCapabilityStatus;
  webRisk: CapabilityStatus;
  contactResolver: CapabilityStatus;
  drive: CapabilityStatus;
  calendar: CapabilityStatus;
};

const runtimes: readonly AppRuntime[] = ['local', 'ai_studio', 'cloud_run'];
const capabilityStates: readonly CapabilityState[] = [
  'available',
  'configured',
  'local_only',
  'not_configured',
  'temporarily_unavailable',
  'planned',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseCapability(value: unknown, field: string): CapabilityStatus {
  if (!isRecord(value) || typeof value.state !== 'string' || !capabilityStates.includes(value.state as CapabilityState)) {
    throw new Error(`Trạng thái ${field} không hợp lệ.`);
  }
  return {state: value.state as CapabilityState};
}

export function parseCapabilitiesResponseV1(input: unknown): CapabilitiesResponseV1 {
  if (!isRecord(input) || input.apiVersion !== CAPABILITIES_API_VERSION) {
    throw new Error('Phiên bản capability API không hợp lệ.');
  }
  if (typeof input.runtime !== 'string' || !runtimes.includes(input.runtime as AppRuntime)) {
    throw new Error('Runtime không hợp lệ.');
  }
  if (typeof input.checkedAt !== 'string' || Number.isNaN(Date.parse(input.checkedAt))) {
    throw new Error('Thời điểm kiểm tra capability không hợp lệ.');
  }

  const analysis = parseCapability(input.analysis, 'analysis') as AnalysisCapabilityStatus;
  if (isRecord(input.analysis) && input.analysis.model !== undefined) {
    if (typeof input.analysis.model !== 'string' || !input.analysis.model.trim()) {
      throw new Error('Model capability không hợp lệ.');
    }
    analysis.model = input.analysis.model;
  }

  return {
    apiVersion: CAPABILITIES_API_VERSION,
    runtime: input.runtime as AppRuntime,
    checkedAt: input.checkedAt,
    analysis,
    webRisk: parseCapability(input.webRisk, 'webRisk'),
    contactResolver: parseCapability(input.contactResolver, 'contactResolver'),
    drive: parseCapability(input.drive, 'drive'),
    calendar: parseCapability(input.calendar, 'calendar'),
  };
}

export function resolveAppRuntime(environment: Record<string, string | undefined>): AppRuntime {
  const configured = environment.SCAMSIGNAL_RUNTIME;
  if (configured && runtimes.includes(configured as AppRuntime)) return configured as AppRuntime;
  if (environment.K_SERVICE) return 'cloud_run';
  if (environment.AI_STUDIO_APP_ID || environment.DISABLE_HMR === 'true') return 'ai_studio';
  return 'local';
}

export function createCapabilitiesResponseV1(environment: Record<string, string | undefined>): CapabilitiesResponseV1 {
  const analysisAvailable = Boolean(environment.GEMINI_API_KEY);
  return {
    apiVersion: CAPABILITIES_API_VERSION,
    runtime: resolveAppRuntime(environment),
    checkedAt: new Date().toISOString(),
    analysis: {
      state: analysisAvailable ? 'configured' : 'not_configured',
      ...(analysisAvailable ? {model: environment.GEMINI_MODEL || 'gemini-3.5-flash-lite'} : {}),
    },
    webRisk: {state: environment.WEB_RISK_API_KEY ? 'configured' : 'not_configured'},
    contactResolver: {state: 'planned'},
    drive: {state: 'planned'},
    calendar: {state: 'planned'},
  };
}
