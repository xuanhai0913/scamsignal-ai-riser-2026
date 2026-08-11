import {describe, expect, it} from 'vitest';
import {extractReferenceDomains, extractUrls, inspectUrl} from './url-analysis.js';

describe('URL evidence engine', () => {
  it('finds a one-character typosquat against an explicit reference domain', () => {
    const text = 'Mở https://novabarnk.vn/secure. Tên miền chính thức: novabank.vn';
    const urls = extractUrls(text);
    const references = extractReferenceDomains(text);
    const inspection = inspectUrl(urls[0], references);

    expect(references).toEqual(['novabank.vn']);
    expect(inspection?.registrableDomain).toBe('novabarnk.vn');
    expect(inspection?.structuralRisk).toBe('critical');
    expect(inspection?.findings.some((finding) => finding.code === 'typosquat-novabank.vn')).toBe(true);
  });

  it('detects trust words placed in a deceptive subdomain', () => {
    const inspection = inspectUrl('https://bank.login.secure.example.com/verify');
    expect(inspection?.registrableDomain).toBe('example.com');
    expect(inspection?.findings.some((finding) => finding.code === 'brand-subdomain')).toBe(true);
  });

  it('does not label a plain HTTPS URL safe, only as having no strong structural signal', () => {
    const inspection = inspectUrl('https://example.com/support');
    expect(inspection?.structuralRisk).toBe('no_strong_signal');
    expect(inspection?.webRisk.status).toBe('not_configured');
  });
});
