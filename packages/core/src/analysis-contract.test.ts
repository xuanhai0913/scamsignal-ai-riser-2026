import {describe, expect, it} from 'vitest';
import type {AnalysisPipeline, UrlInspection} from './types.js';
import {finalizeAnalysis, type ModelAnalysisPayload} from './analysis-contract.js';

const pipeline: AnalysisPipeline = {
  model: 'gemini-2.5-flash',
  backend: 'cloud_run',
  webRisk: 'not_configured',
  redactionCount: 0,
  durationMs: 120,
};

const lowRiskPayload: ModelAnalysisPayload = {
  riskScore: 8,
  confidence: 86,
  riskLevel: 'Ít rủi ro',
  summary: 'Nội dung chưa có dấu hiệu lừa đảo rõ ràng nhưng vẫn cần thêm ngữ cảnh.',
  domainComparison: {
    claimed: 'NOVABANK',
    observed: 'novabank',
    prefix: 'novabank',
    changed: '',
    suffix: '',
    explanation: 'So sánh tên tổ chức.',
  },
  evidence: [{
    id: 'message-context',
    label: 'Nội dung chung chung',
    value: 'Thiếu ngữ cảnh',
    detail: 'Không có liên kết, yêu cầu nhạy cảm hoặc hành động cụ thể.',
    severity: 'info',
  }],
  actions: ['Xin thêm toàn bộ nội dung trước khi hành động.'],
  missingInformation: ['Liên kết hoặc yêu cầu cụ thể.'],
  entities: [],
};

describe('analysis finalization', () => {
  it('uses an inconclusive state when plain text has no checkable artifact or risk signal', () => {
    const analysis = finalizeAnalysis(lowRiskPayload, {
      urlInspections: [],
      referenceDomains: [],
      hasImageEvidence: false,
      pipeline,
    });

    expect(analysis.level).toBe('Chưa đủ dữ kiện');
    expect(analysis.confidence).toBe(49);
    expect(analysis.domain).toBeUndefined();
    expect(analysis.evidence.every((item) => item.verification === 'unknown')).toBe(true);
  });

  it('preserves a non-alarmist low-risk result when an HTTPS URL was inspected', () => {
    const inspectedUrl: UrlInspection = {
      input: 'https://novabank.vn/support',
      normalizedUrl: 'https://novabank.vn/support',
      hostname: 'novabank.vn',
      registrableDomain: 'novabank.vn',
      subdomain: '',
      structuralRisk: 'no_strong_signal',
      findings: [],
      webRisk: {status: 'not_configured', threatTypes: []},
    };

    const analysis = finalizeAnalysis(lowRiskPayload, {
      urlInspections: [inspectedUrl],
      referenceDomains: [],
      hasImageEvidence: false,
      pipeline,
    });

    expect(analysis.level).toBe('Ít rủi ro');
    expect(analysis.confidence).toBe(86);
    expect(analysis.domain).toBeUndefined();
    expect(analysis.evidence[0]?.verification).toBe('inferred');
  });

  it('honors Gemini explicitly returning the inconclusive state for image evidence', () => {
    const analysis = finalizeAnalysis({...lowRiskPayload, riskLevel: 'Chưa đủ dữ kiện'}, {
      urlInspections: [],
      referenceDomains: [],
      hasImageEvidence: true,
      pipeline,
    });

    expect(analysis.level).toBe('Chưa đủ dữ kiện');
    expect(analysis.confidence).toBeLessThanOrEqual(49);
  });
});
