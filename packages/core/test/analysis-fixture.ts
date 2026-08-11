import type {Analysis} from '../src/types.js';

export function createAnalysisFixture(): Analysis {
  return {
    score: 92,
    confidence: 89,
    level: 'Nguy hiểm',
    summary: 'Tên miền gần giống ngân hàng và nội dung yêu cầu cung cấp OTP.',
    domain: {
      claimed: 'novabank.vn',
      observed: 'novabarnk.vn',
      prefix: 'novaba',
      changed: 'r',
      suffix: 'nk.vn',
      explanation: 'Tên miền quan sát lệch một ký tự so với tên miền đối chiếu.',
      verification: 'verified',
    },
    evidence: [{
      id: 'typosquat-novabank.vn-novabarnk.vn',
      label: 'Tên miền gần giống tên miền đối chiếu',
      value: 'novabarnk.vn',
      detail: 'Tên miền chỉ lệch một ký tự so với novabank.vn.',
      severity: 'critical',
      source: 'deterministic',
      verification: 'verified',
    }],
    actions: ['Không mở liên kết và không cung cấp OTP.'],
    missingInformation: ['Chưa xác minh danh tính người gửi.'],
    entities: ['novabarnk.vn'],
    urlInspections: [{
      input: 'https://novabarnk.vn/secure',
      normalizedUrl: 'https://novabarnk.vn/secure',
      hostname: 'novabarnk.vn',
      registrableDomain: 'novabarnk.vn',
      subdomain: '',
      structuralRisk: 'critical',
      findings: [{
        code: 'typosquat-novabank.vn',
        label: 'Tên miền gần giống tên miền đối chiếu',
        detail: 'Tên miền chỉ lệch một ký tự so với novabank.vn.',
        severity: 'critical',
      }],
      webRisk: {
        status: 'not_configured',
        threatTypes: [],
      },
    }],
    pipeline: {
      model: 'gemini-2.5-flash',
      backend: 'cloud_run',
      webRisk: 'not_configured',
      redactionCount: 1,
      durationMs: 420,
    },
  };
}
