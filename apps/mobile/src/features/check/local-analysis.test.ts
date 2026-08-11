import {describe, expect, it} from 'vitest';
import {runLocalCheck} from './local-analysis.js';

describe('mobile local check', () => {
  it('finds a one-character banking typosquat without opening the URL', () => {
    const result = runLocalCheck(
      'Xác minh giao dịch ngay tại https://novabarnk.vn/secure và nhập OTP 123456.',
      'Tên miền chính thức: novabank.vn',
    );

    expect(result.band).toBe('critical_signal');
    expect(result.inspections[0].registrableDomain).toBe('novabarnk.vn');
    expect(result.findings.some((finding) => finding.id.includes('typosquat-novabank.vn'))).toBe(true);
    expect(result.redactionCount).toBeGreaterThan(0);
  });

  it('keeps an official domain in a non-conclusive state', () => {
    const result = runLocalCheck(
      'Mở ứng dụng hoặc xem thông tin tại https://novabank.vn/thong-bao để biết thêm chi tiết.',
      'Tên miền chính thức: novabank.vn',
    );

    expect(result.band).toBe('no_strong_signal');
    expect(result.label).not.toContain('an toàn');
  });
});
