import {describe, expect, it} from 'vitest';
import {inspectUrl} from '../packages/core/src/url-analysis.js';

const cases = [
  // Critical: identity deception, typosquatting, or hostname obfuscation.
  {category: 'typosquat', name: 'inserted letter in fictional bank', url: 'https://novabarnk.vn/secure', references: ['novabank.vn'], expected: 'critical'},
  {category: 'typosquat', name: 'deleted letter in fictional bank', url: 'https://novabnk.vn/login', references: ['novabank.vn'], expected: 'critical'},
  {category: 'typosquat', name: 'duplicated final letter', url: 'https://novabankk.vn/otp', references: ['novabank.vn'], expected: 'critical'},
  {category: 'typosquat', name: 'inserted character in Vietnamese bank-like name', url: 'https://vietcornbank.example/secure', references: ['vietcombank.example'], expected: 'critical'},
  {category: 'typosquat', name: 'marketplace extra letter', url: 'https://shopeee.example/refund', references: ['shopee.example'], expected: 'critical'},
  {category: 'typosquat', name: 'wallet numeric suffix', url: 'https://momo0.example/payment', references: ['momo.example'], expected: 'critical'},
  {category: 'typosquat', name: 'payment brand duplicate character', url: 'https://zalopayy.example/verify', references: ['zalopay.example'], expected: 'critical'},
  {category: 'typosquat', name: 'government-like missing character', url: 'https://dichvucongq.example', references: ['dichvucong.example'], expected: 'critical'},
  {category: 'subdomain', name: 'bank and login trust terms in subdomain', url: 'https://bank.login.example.com', references: [], expected: 'critical'},
  {category: 'subdomain', name: 'secure trust term in subdomain', url: 'https://secure.example.com/update', references: [], expected: 'critical'},
  {category: 'subdomain', name: 'police trust term in subdomain', url: 'https://congan.example.com/notice', references: [], expected: 'critical'},
  {category: 'subdomain', name: 'tax trust term in subdomain', url: 'https://tax.example.com/refund', references: [], expected: 'critical'},
  {category: 'userinfo', name: 'brand before at sign', url: 'https://novabank.vn@example.com/login', references: [], expected: 'critical'},
  {category: 'userinfo', name: 'support identity before at sign', url: 'https://support@example.com/verify', references: [], expected: 'critical'},
  {category: 'punycode', name: 'punycode registrable domain', url: 'https://xn--80ak6aa92e.com', references: [], expected: 'critical'},
  {category: 'punycode', name: 'punycode hostname label', url: 'https://xn--bcher-kva.example.com', references: [], expected: 'critical'},
  {category: 'subdomain', name: 'verification term in subdomain', url: 'https://verify.accounts.example.com', references: [], expected: 'critical'},
  {category: 'subdomain', name: 'otp term in subdomain', url: 'https://otp.example.com/confirm', references: [], expected: 'critical'},
  {category: 'subdomain', name: 'wallet term in subdomain', url: 'https://wallet.example.com/recover', references: [], expected: 'critical'},
  {category: 'subdomain', name: 'payment term in subdomain', url: 'https://payment.example.com/invoice', references: [], expected: 'critical'},

  // Suspicious: transport or structure warnings that need more evidence.
  {category: 'ip', name: 'raw IPv4 over HTTP', url: 'http://192.168.10.10/login', references: [], expected: 'suspicious'},
  {category: 'ip', name: 'raw IPv4 over HTTPS', url: 'https://203.0.113.20/payment', references: [], expected: 'suspicious'},
  {category: 'ip', name: 'raw IPv6 address', url: 'http://[2001:db8::1]/login', references: [], expected: 'suspicious'},
  {category: 'transport', name: 'plain HTTP landing page', url: 'http://example.com/payment', references: [], expected: 'suspicious'},
  {category: 'transport', name: 'plain HTTP official-like path', url: 'http://novabank.vn/help', references: ['novabank.vn'], expected: 'suspicious'},
  {category: 'shortener', name: 'bitly redirect', url: 'https://bit.ly/example', references: [], expected: 'suspicious'},
  {category: 'shortener', name: 'tinyurl redirect', url: 'https://tinyurl.com/demo-path', references: [], expected: 'suspicious'},
  {category: 'shortener', name: 'tco redirect', url: 'https://t.co/demo', references: [], expected: 'suspicious'},
  {category: 'shortener', name: 'cuttly redirect', url: 'https://cutt.ly/demo', references: [], expected: 'suspicious'},
  {category: 'shortener', name: 'rebrandly redirect', url: 'https://rebrand.ly/demo', references: [], expected: 'suspicious'},
  {category: 'shortener', name: 'shorturl redirect', url: 'https://shorturl.at/demo', references: [], expected: 'suspicious'},
  {category: 'shortener', name: 'isgd redirect', url: 'https://is.gd/demo', references: [], expected: 'suspicious'},
  {category: 'shortener', name: 'tinycc redirect', url: 'https://tiny.cc/demo', references: [], expected: 'suspicious'},
  {category: 'obfuscation', name: 'encoded verification path', url: 'https://example.com/%76%65%72%69%66%79', references: [], expected: 'suspicious'},
  {category: 'obfuscation', name: 'very long path', url: `https://example.com/${'a'.repeat(150)}`, references: [], expected: 'suspicious'},
  {category: 'port', name: 'HTTPS alternate port 8443', url: 'https://example.com:8443/login', references: [], expected: 'suspicious'},
  {category: 'port', name: 'HTTPS development port 8080', url: 'https://example.com:8080/secure', references: [], expected: 'suspicious'},
  {category: 'port', name: 'HTTP alternate port', url: 'http://example.com:3000/payment', references: [], expected: 'suspicious'},
  {category: 'transport', name: 'plain HTTP with benign path', url: 'http://docs.example.com/guide', references: [], expected: 'suspicious'},
  {category: 'obfuscation', name: 'encoded account path', url: 'https://example.com/account/%2Fconfirm', references: [], expected: 'suspicious'},

  // No strong structural signal: false-positive guards and ordinary HTTPS URLs.
  {category: 'benign', name: 'ordinary HTTPS help page', url: 'https://example.com/help', references: [], expected: 'no_strong_signal'},
  {category: 'benign', name: 'exact official reference', url: 'https://novabank.vn/support', references: ['novabank.vn'], expected: 'no_strong_signal'},
  {category: 'benign', name: 'login word in path only', url: 'https://example.com/login', references: [], expected: 'no_strong_signal'},
  {category: 'benign', name: 'secure term belongs to registrable domain', url: 'https://securebank.vn/help', references: [], expected: 'no_strong_signal'},
  {category: 'benign', name: 'ordinary documentation subdomain', url: 'https://docs.example.com/security', references: [], expected: 'no_strong_signal'},
  {category: 'benign', name: 'ordinary help subdomain on exact reference', url: 'https://help.novabank.vn/faq', references: ['novabank.vn'], expected: 'no_strong_signal'},
  {category: 'benign', name: 'maps product page', url: 'https://maps.google.com/about', references: [], expected: 'no_strong_signal'},
  {category: 'benign', name: 'mail product page', url: 'https://mail.google.com/inbox', references: [], expected: 'no_strong_signal'},
  {category: 'benign', name: 'ordinary commerce path', url: 'https://shop.example.com/products', references: [], expected: 'no_strong_signal'},
  {category: 'benign', name: 'uppercase input normalizes safely', url: 'https://NOVABANK.VN/Help', references: ['novabank.vn'], expected: 'no_strong_signal'},
] as const;

describe('URL engine evaluation set', () => {
  it('contains 50 balanced structural-risk cases', () => {
    expect(cases).toHaveLength(50);
    expect(cases.filter((testCase) => testCase.expected === 'critical')).toHaveLength(20);
    expect(cases.filter((testCase) => testCase.expected === 'suspicious')).toHaveLength(20);
    expect(cases.filter((testCase) => testCase.expected === 'no_strong_signal')).toHaveLength(10);
  });

  for (const testCase of cases) {
    it(`${testCase.category}: ${testCase.name}`, () => {
      expect(inspectUrl(testCase.url, [...testCase.references])?.structuralRisk).toBe(testCase.expected);
    });
  }
});
