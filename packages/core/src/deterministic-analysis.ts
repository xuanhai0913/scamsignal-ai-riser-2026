import type {Analysis, AnalyzeRequest, Evidence, UrlInspection} from './types.js';
import {extractReferenceDomains, extractUrls, inspectUrls} from './url-analysis.js';

type LocalSignal = {
  id: string;
  label: string;
  detail: string;
  severity: 'critical' | 'warning';
  matched: boolean;
};

const LOCAL_MODEL = 'deterministic-safety-engine-v1';
const CLAUSE_BOUNDARY_PATTERN = /[.!?;\n]/gu;
const ADVERSATIVE_PATTERN = /(?:^|[^\p{L}\p{N}_])(?:nhưng|tuy\s*nhiên|trái\s*lại|sau\s*đó)(?=$|[^\p{L}\p{N}_])/giu;
const DIRECT_NEGATION_TAIL = /(?:^|[^\p{L}\p{N}_])(?:không|chưa|chẳng|đừng|chớ)(?:\s+(?:hề|có|cần|phải|bao\s+giờ))*\s*$/iu;
const NEGATED_ACTION_TAIL = /(?:^|[^\p{L}\p{N}_])(?:không|chưa|chẳng)\s+(?:(?:hề|có|cần|phải|từng|bao\s+giờ)\s+)*(?:yêu\s*cầu|đề\s*nghị|bắt|cung\s*cấp|nhập|gửi|chia\s*sẻ|đọc|tiết\s*lộ|chuyển|thực\s*hiện)(?:\s+[\p{L}\p{N}_-]+){0,5}\s*$/iu;
const PROHIBITIVE_TAIL = /(?:^|[^\p{L}\p{N}_])(?:đừng|chớ|tuyệt\s*đối\s*không|không\s*bao\s*giờ)(?=$|[^\p{L}\p{N}_])[^.!?;\n]{0,100}$/iu;

function lastMatchEnd(text: string, pattern: RegExp) {
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    end = Math.max(end, (match.index ?? 0) + match[0].length);
  }
  return end;
}

function isNegatedMatch(text: string, matchIndex: number) {
  const prefix = text.slice(Math.max(0, matchIndex - 120), matchIndex);
  const boundaryStart = lastMatchEnd(prefix, CLAUSE_BOUNDARY_PATTERN);
  const adversativeStart = lastMatchEnd(prefix, ADVERSATIVE_PATTERN);
  const localContext = prefix.slice(Math.max(boundaryStart, adversativeStart));
  return DIRECT_NEGATION_TAIL.test(localContext)
    || NEGATED_ACTION_TAIL.test(localContext)
    || PROHIBITIVE_TAIL.test(localContext);
}

function hasActionableMatch(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].some((match) => !isNegatedMatch(text, match.index ?? 0));
}

function urlEvidence(inspections: UrlInspection[]): Evidence[] {
  return inspections.flatMap((inspection) => inspection.findings.map((finding) => ({
    id: `${finding.code}-${inspection.registrableDomain}`,
    label: finding.label,
    value: inspection.registrableDomain,
    detail: finding.detail,
    severity: finding.severity,
    source: 'deterministic' as const,
    verification: 'verified' as const,
  })));
}

function splitObservedDifference(observed: string, claimed: string) {
  let prefixLength = 0;
  while (
    prefixLength < observed.length
    && prefixLength < claimed.length
    && observed[prefixLength] === claimed[prefixLength]
  ) prefixLength += 1;

  let suffixLength = 0;
  while (
    suffixLength < observed.length - prefixLength
    && suffixLength < claimed.length - prefixLength
    && observed[observed.length - 1 - suffixLength] === claimed[claimed.length - 1 - suffixLength]
  ) suffixLength += 1;

  return {
    prefix: observed.slice(0, prefixLength),
    changed: observed.slice(prefixLength, observed.length - suffixLength) || observed[prefixLength] || observed,
    suffix: suffixLength > 0 ? observed.slice(-suffixLength) : '',
  };
}

function verifiedDomainComparison(inspections: UrlInspection[], references: string[]): Analysis['domain'] {
  for (const inspection of inspections) {
    for (const reference of references) {
      if (!inspection.findings.some((finding) => finding.code === `typosquat-${reference}`)) continue;
      return {
        claimed: reference,
        observed: inspection.registrableDomain,
        ...splitObservedDifference(inspection.registrableDomain, reference),
        explanation: `So sánh ký tự trực tiếp với tên miền đối chiếu do người dùng cung cấp: ${reference}.`,
        verification: 'verified',
      };
    }
  }
  return undefined;
}

function contentSignals(text: string): LocalSignal[] {
  return [
    {
      id: 'credential-request',
      label: 'Yêu cầu thông tin xác thực',
      detail: 'Nội dung nhắc đến OTP, mật khẩu hoặc mã PIN. Không cung cấp các dữ liệu này qua liên kết được gửi đến.',
      severity: 'critical',
      matched: hasActionableMatch(
        text,
        /\b(?:otp|password|pin)\b|mật\s*khẩu|mã\s*(?:xác\s*thực|đăng\s*nhập)/giu,
      ),
    },
    {
      id: 'urgency-pressure',
      label: 'Tạo áp lực phải hành động gấp',
      detail: 'Nội dung dùng thời hạn, đe dọa khóa tài khoản hoặc hậu quả để giảm thời gian kiểm tra.',
      severity: 'warning',
      matched: hasActionableMatch(
        text,
        /trong\s+\d+\s*phút|ngay\s+lập\s+tức|khóa\s+tài\s*khoản|quá\s*hạn|khẩn\s*cấp|không\s+chịu\s+trách\s+nhiệm/giu,
      ),
    },
    {
      id: 'money-request',
      label: 'Liên quan đến tiền hoặc giao dịch',
      detail: 'Nội dung đề cập chuyển tiền, tài khoản hoặc một giao dịch tài chính cần được xác minh độc lập.',
      severity: 'warning',
      matched: hasActionableMatch(
        text,
        /chuyển\s*(?:tiền|khoản)|số\s*tài\s*khoản|giao\s*dịch|ví\s*điện\s*tử|\d[\d.,]{3,}\s*(?:đ|vnd|triệu)/giu,
      ),
    },
    {
      id: 'authority-impersonation',
      label: 'Mạo danh tổ chức có thẩm quyền',
      detail: 'Nội dung viện dẫn ngân hàng hoặc cơ quan công quyền; cần tự tìm kênh liên hệ chính thức để xác minh.',
      severity: 'warning',
      matched: hasActionableMatch(
        text,
        /ngân\s*hàng|công\s*an|bộ\s*công\s*an|chính\s*phủ|cơ\s*quan\s*thuế|tòa\s*án/giu,
      ),
    },
  ];
}

export function analyzeDeterministically(
  request: AnalyzeRequest,
  options: {redactionCount?: number; startedAt?: number} = {},
): Analysis {
  const startedAt = options.startedAt ?? Date.now();
  const combinedText = `${request.message}\n${request.extraInfo}`;
  const referenceDomains = extractReferenceDomains(combinedText);
  // Inspect actionable links from the submitted message. An explicit official
  // domain in the optional comparison field is reference evidence, not another
  // suspicious link that should appear in the result list.
  const inspections = inspectUrls(extractUrls(request.message), referenceDomains);
  const signals = contentSignals(combinedText).filter((signal) => signal.matched);
  const evidence: Evidence[] = [
    ...urlEvidence(inspections),
    ...signals.map((signal) => ({
      id: signal.id,
      label: signal.label,
      value: 'Phát hiện trong nội dung đã che dữ liệu nhạy cảm',
      detail: signal.detail,
      severity: signal.severity,
      source: 'deterministic' as const,
      verification: 'verified' as const,
    })),
  ].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 8);

  const hasCriticalUrl = inspections.some((inspection) => inspection.structuralRisk === 'critical');
  const hasCredential = signals.some((signal) => signal.id === 'credential-request');
  const hasUrgency = signals.some((signal) => signal.id === 'urgency-pressure');
  const hasMoney = signals.some((signal) => signal.id === 'money-request');
  const hasSuspiciousUrl = inspections.some((inspection) => inspection.structuralRisk === 'suspicious');
  const warningCount = evidence.filter((item) => item.severity === 'warning').length;
  const level = hasCriticalUrl || (hasCredential && (hasUrgency || hasMoney))
    ? 'Nguy hiểm'
    : evidence.some((item) => item.severity === 'critical') || hasSuspiciousUrl || warningCount >= 2
      ? 'Đáng ngờ'
      : 'Chưa đủ dữ kiện';

  const finalEvidence = evidence.length > 0 ? evidence : [{
    id: 'insufficient-local-evidence',
    label: 'Chưa có tín hiệu có thể kiểm chứng cục bộ',
    value: 'Cần thêm bằng chứng',
    detail: 'Hãy bổ sung liên kết, tên miền đối chiếu hoặc ảnh chụp rõ nội dung để tiếp tục kiểm tra.',
    severity: 'info' as const,
    source: 'deterministic' as const,
    verification: 'unknown' as const,
  }];

  const summary = level === 'Nguy hiểm'
    ? 'Kiểm tra nhanh cục bộ phát hiện tổ hợp dấu hiệu rủi ro cao. AI hiện chưa khả dụng, vì vậy hãy tạm dừng và xác minh qua kênh chính thức.'
    : level === 'Đáng ngờ'
      ? 'Kiểm tra nhanh cục bộ phát hiện dấu hiệu đáng ngờ. AI hiện chưa khả dụng nên kết quả này chỉ dùng để ưu tiên hành động an toàn.'
      : 'Kiểm tra cục bộ chưa có đủ dữ kiện để kết luận. AI hiện chưa khả dụng; đừng xem việc thiếu cảnh báo là bằng chứng an toàn.';

  return {
    // A deterministic fallback must not pretend to provide an AI score.
    // The UI hides both values whenever LOCAL_MODEL is active.
    score: 0,
    confidence: 0,
    level,
    summary,
    domain: verifiedDomainComparison(inspections, referenceDomains),
    evidence: finalEvidence,
    actions: [
      'Tạm dừng chuyển tiền và không nhập OTP, mật khẩu hoặc mã PIN.',
      'Tự mở ứng dụng hoặc website chính thức, không dùng liên kết trong tin nhắn.',
      'Gọi số liên hệ lấy từ ứng dụng, mặt sau thẻ hoặc website chính thức để xác minh.',
    ],
    missingInformation: [
      ...(referenceDomains.length === 0 ? ['Tên miền chính thức do bạn tự tra cứu.'] : []),
      ...(inspections.length === 0 ? ['Liên kết hoặc tên miền xuất hiện trong nội dung.'] : []),
      'Kết quả AI khi dịch vụ server-side hoạt động trở lại.',
    ],
    entities: inspections.map((inspection) => inspection.registrableDomain),
    urlInspections: inspections,
    pipeline: {
      model: LOCAL_MODEL,
      backend: 'local',
      webRisk: 'not_configured',
      redactionCount: options.redactionCount ?? 0,
      durationMs: Math.max(0, Date.now() - startedAt),
    },
  };
}
