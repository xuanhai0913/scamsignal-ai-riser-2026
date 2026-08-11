import {getDomain, getDomainWithoutSuffix, getSubdomain} from 'tldts';
import type {EvidenceSeverity, UrlFinding, UrlInspection} from './types.js';

const URL_PATTERN = /https?:\/\/[^\s<>"'`\])}]+|(?<![@\w])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?:\/[^\s<>"'`\])}]*)?/giu;
const EXPLICIT_REFERENCE_PATTERN = /(?:tên\s*miền\s*chính\s*thức|official\s*domain|tên\s*miền\s*đối\s*chiếu)\s*[:：]\s*([a-z0-9.-]+\.[a-z]{2,})/giu;
const SHORTENER_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'rebrand.ly', 'shorturl.at', 'is.gd', 'tiny.cc',
]);
const IMPERSONATION_TERMS = new Set([
  'bank', 'ebank', 'banking', 'secure', 'security', 'login', 'verify', 'verification', 'otp', 'account',
  'congan', 'chinhphu', 'gov', 'tax', 'support', 'wallet', 'payment',
]);

function cleanUrlCandidate(value: string) {
  return value.replace(/[.,;:!?]+$/g, '');
}

function toUrl(value: string) {
  const cleaned = cleanUrlCandidate(value);
  return new URL(/^https?:\/\//iu.test(cleaned) ? cleaned : `https://${cleaned}`);
}

function isIpAddress(hostname: string) {
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/u.test(hostname);
  const ipv6 = hostname.includes(':');
  return ipv4 || ipv6;
}

function levenshtein(left: string, right: string) {
  const previous = Array.from({length: right.length + 1}, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      previous[rightIndex] = Math.min(previous[rightIndex] + 1, previous[rightIndex - 1] + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return previous[right.length];
}

function addFinding(findings: UrlFinding[], code: string, label: string, detail: string, severity: EvidenceSeverity) {
  if (findings.some((item) => item.code === code)) return;
  findings.push({code, label, detail, severity});
}

export function extractUrls(text: string) {
  const urls = text.match(URL_PATTERN) || [];
  return [...new Set(urls.map(cleanUrlCandidate))].slice(0, 5);
}

export function extractReferenceDomains(text: string) {
  const references: string[] = [];
  for (const match of text.matchAll(EXPLICIT_REFERENCE_PATTERN)) {
    const domain = getDomain(match[1]);
    if (domain) references.push(domain.toLowerCase());
  }
  return [...new Set(references)];
}

export function inspectUrl(input: string, referenceDomains: string[] = []): UrlInspection | undefined {
  let url: URL;
  try {
    url = toUrl(input);
  } catch {
    return undefined;
  }

  const hostname = url.hostname.toLowerCase();
  const registrableDomain = (getDomain(hostname) || hostname).toLowerCase();
  const subdomain = getSubdomain(hostname) || '';
  const findings: UrlFinding[] = [];

  if (url.protocol === 'http:') {
    addFinding(findings, 'plain-http', 'Kết nối không mã hóa', 'Liên kết dùng HTTP thay vì HTTPS.', 'warning');
  }
  if (url.username || url.password || input.includes('@')) {
    addFinding(findings, 'userinfo', 'Che giấu tên miền bằng ký tự @', 'Phần trước dấu @ có thể khiến người đọc nhầm tên miền thật.', 'critical');
  }
  if (isIpAddress(hostname)) {
    addFinding(findings, 'ip-host', 'Dùng địa chỉ IP trực tiếp', 'Trang giao dịch hợp pháp hiếm khi yêu cầu đăng nhập qua địa chỉ IP.', 'warning');
  }
  if (hostname.includes('xn--')) {
    addFinding(findings, 'punycode', 'Tên miền Unicode đã mã hóa', 'Punycode có thể được dùng để tạo ký tự trông gần giống thương hiệu.', 'critical');
  }
  if (url.port && !['80', '443'].includes(url.port)) {
    addFinding(findings, 'unusual-port', 'Cổng truy cập bất thường', `Liên kết sử dụng cổng ${url.port}.`, 'warning');
  }
  if (SHORTENER_DOMAINS.has(registrableDomain)) {
    addFinding(findings, 'shortener', 'Liên kết rút gọn', 'Tên miền đích đang bị ẩn và cần được kiểm tra trước khi mở.', 'warning');
  }
  if (input.length > 140 || /%[0-9a-f]{2}/iu.test(input)) {
    addFinding(findings, 'obfuscated-url', 'Đường dẫn dài hoặc mã hóa', 'Cấu trúc URL khó đọc làm tăng nguy cơ che giấu đích đến.', 'warning');
  }

  const subdomainTerms = subdomain.toLowerCase().split(/[.-]/u).filter(Boolean);
  const deceptiveTerms = subdomainTerms.filter((term) => IMPERSONATION_TERMS.has(term));
  if (deceptiveTerms.length > 0 && !deceptiveTerms.some((term) => registrableDomain.includes(term))) {
    addFinding(
      findings,
      'brand-subdomain',
      'Từ khóa tạo niềm tin nằm ở subdomain',
      `“${deceptiveTerms.join(', ')}” không thuộc tên miền gốc ${registrableDomain}.`,
      'critical',
    );
  }

  const observedName = getDomainWithoutSuffix(registrableDomain) || registrableDomain.split('.')[0];
  for (const reference of referenceDomains) {
    const referenceDomain = (getDomain(reference) || reference).toLowerCase();
    if (referenceDomain === registrableDomain) continue;
    const referenceName = getDomainWithoutSuffix(referenceDomain) || referenceDomain.split('.')[0];
    const distance = levenshtein(observedName, referenceName);
    if (distance > 0 && distance <= 2) {
      addFinding(
        findings,
        `typosquat-${referenceDomain}`,
        'Tên miền gần giống tên miền đối chiếu',
        `${registrableDomain} khác ${referenceDomain} ${distance} ký tự.`,
        'critical',
      );
    }
  }

  const hasCritical = findings.some((item) => item.severity === 'critical');
  const hasWarning = findings.some((item) => item.severity === 'warning');

  return {
    input,
    normalizedUrl: url.toString(),
    hostname,
    registrableDomain,
    subdomain,
    structuralRisk: hasCritical ? 'critical' : hasWarning ? 'suspicious' : 'no_strong_signal',
    findings,
    webRisk: {status: 'not_configured', threatTypes: []},
  };
}

export function inspectUrls(urls: string[], referenceDomains: string[] = []) {
  return urls.flatMap((url) => {
    const inspection = inspectUrl(url, referenceDomains);
    return inspection ? [inspection] : [];
  });
}
