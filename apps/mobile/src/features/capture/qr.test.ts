import {describe, expect, it} from 'vitest';

import {firstQrData} from './qr';

describe('firstQrData', () => {
  it('returns the first non-empty QR payload and trims it', () => {
    expect(
      firstQrData([
        {type: 'ean13', data: '8931234567890'},
        {type: 'qr', data: '  https://novabarnk.vn/secure  '},
        {type: 'qr', data: 'second'},
      ]),
    ).toBe('https://novabarnk.vn/secure');
  });

  it('ignores empty and non-QR scan results', () => {
    expect(firstQrData([{type: 'qr', data: '   '}, {type: 'aztec', data: 'value'}])).toBeUndefined();
  });
});
