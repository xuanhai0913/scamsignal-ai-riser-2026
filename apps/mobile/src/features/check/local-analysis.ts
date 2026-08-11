import {redactSensitiveText} from '@scamsignal/core/privacy';
import {
  extractReferenceDomains,
  extractUrls,
  inspectUrls,
} from '@scamsignal/core/url-analysis';
import type {EvidenceSeverity, UrlInspection} from '@scamsignal/core/types';

export type LocalFinding = {
  id: string;
  label: string;
  detail: string;
  severity: EvidenceSeverity;
};

export type LocalCheckResult = {
  band: 'critical_signal' | 'attention' | 'no_strong_signal' | 'no_url';
  label: string;
  summary: string;
  inspections: UrlInspection[];
  findings: LocalFinding[];
  redactionCount: number;
};

export function runLocalCheck(message: string, extraInfo: string): LocalCheckResult {
  const messageRedaction = redactSensitiveText(message);
  const extraRedaction = redactSensitiveText(extraInfo);
  const redactedBundle = `${messageRedaction.value}\n${extraRedaction.value}`;
  const references = extractReferenceDomains(redactedBundle);
  const urls = extractUrls(redactedBundle);
  const inspections = inspectUrls(urls, references);
  const findings = inspections.flatMap((inspection) => inspection.findings.map((finding) => ({
    id: `${finding.code}-${inspection.registrableDomain}`,
    label: finding.label,
    detail: finding.detail,
    severity: finding.severity,
  })));
  const redactionCount = messageRedaction.count + extraRedaction.count;

  if (inspections.length === 0) {
    return {
      band: 'no_url',
      label: 'Chưa thấy liên kết để đối chiếu',
      summary: 'Nội dung vẫn cần AI đọc ngữ cảnh và kiểm tra các thủ thuật thúc ép hoặc giả mạo.',
      inspections,
      findings,
      redactionCount,
    };
  }
  if (findings.some((finding) => finding.severity === 'critical')) {
    return {
      band: 'critical_signal',
      label: 'Dừng lại — có tín hiệu giả mạo mạnh',
      summary: 'Cấu trúc tên miền có điểm bất thường có thể xác minh ngay trên thiết bị.',
      inspections,
      findings,
      redactionCount,
    };
  }
  if (findings.length > 0) {
    return {
      band: 'attention',
      label: 'Cần kiểm tra thêm trước khi tiếp tục',
      summary: 'Đã phát hiện tín hiệu cấu trúc đáng chú ý nhưng chưa đủ để kết luận.',
      inspections,
      findings,
      redactionCount,
    };
  }
  return {
    band: 'no_strong_signal',
    label: 'Chưa thấy tín hiệu URL mạnh',
    summary: 'Điều này không đồng nghĩa nội dung an toàn; cần tiếp tục xác minh ngữ cảnh và nguồn gửi.',
    inspections,
    findings,
    redactionCount,
  };
}
