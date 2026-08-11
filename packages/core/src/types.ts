export type RiskLevel = 'Nguy hiểm' | 'Đáng ngờ' | 'Ít rủi ro' | 'Chưa đủ dữ kiện';

export type EvidenceSeverity = 'critical' | 'warning' | 'info';

export type EvidenceSource = 'deterministic' | 'google_web_risk' | 'gemini';

export type VerificationStatus = 'verified' | 'inferred' | 'unknown';

export type Evidence = {
  id: string;
  label: string;
  value: string;
  detail: string;
  severity: EvidenceSeverity;
  source: EvidenceSource;
  verification: VerificationStatus;
};

export type UrlFinding = {
  code: string;
  label: string;
  detail: string;
  severity: EvidenceSeverity;
};

export type WebRiskStatus = 'threat' | 'not_listed' | 'not_configured' | 'error';

export type UrlInspection = {
  input: string;
  normalizedUrl: string;
  hostname: string;
  registrableDomain: string;
  subdomain: string;
  structuralRisk: 'critical' | 'suspicious' | 'no_strong_signal';
  findings: UrlFinding[];
  webRisk: {
    status: WebRiskStatus;
    threatTypes: string[];
    checkedAt?: string;
  };
};

export type AnalysisPipeline = {
  model: string;
  backend: 'local' | 'ai_studio' | 'cloud_run';
  webRisk: 'checked' | 'not_configured' | 'partial_error';
  redactionCount: number;
  durationMs: number;
};

export type Analysis = {
  score: number;
  confidence: number;
  level: RiskLevel;
  summary: string;
  domain?: {
    claimed: string;
    observed: string;
    prefix: string;
    changed: string;
    suffix: string;
    explanation: string;
    verification: VerificationStatus;
  };
  evidence: Evidence[];
  actions: string[];
  missingInformation: string[];
  entities: string[];
  urlInspections: UrlInspection[];
  pipeline: AnalysisPipeline;
};

export type AnalyzeRequest = {
  message: string;
  extraInfo: string;
  imageDataUrl?: string;
};

export type AnalyzeResponse = {
  analysis: Analysis;
};
