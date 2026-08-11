import {describe, expect, it} from 'vitest';
import {redactSensitiveText} from './privacy.js';

describe('privacy redaction', () => {
  it('redacts OTP, password and long card-like numbers before analysis', () => {
    const result = redactSensitiveText('OTP: 123456, mật khẩu: secret123, thẻ 4111 1111 1111 1111');
    expect(result.value).not.toContain('123456');
    expect(result.value).not.toContain('secret123');
    expect(result.value).not.toContain('4111 1111 1111 1111');
    expect(result.kinds).toEqual(expect.arrayContaining(['otp', 'password', 'card']));
    expect(result.count).toBe(3);
  });

  it('keeps transaction amounts and OTP warnings that contain no actual secret', () => {
    const result = redactSensitiveText('Chuyển 18.500.000đ và không cung cấp OTP cho bất kỳ ai.');
    expect(result.value).toBe('Chuyển 18.500.000đ và không cung cấp OTP cho bất kỳ ai.');
    expect(result.count).toBe(0);
  });
});
