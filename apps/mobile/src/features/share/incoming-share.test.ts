import {describe, expect, it} from 'vitest';

import {MAX_SHARED_TEXT_LENGTH, normalizeIncomingShare} from './incoming-share';

describe('normalizeIncomingShare', () => {
  it('keeps raw text local and caps the editable draft', () => {
    const result = normalizeIncomingShare([
      {
        value: `  ${'a'.repeat(MAX_SHARED_TEXT_LENGTH + 20)}  `,
        mimeType: 'text/plain',
        shareType: 'text',
      },
    ]);

    expect(result.status).toBe('ready');
    if (result.status !== 'ready' || result.draft.kind !== 'text') return;
    expect(result.draft.text).toHaveLength(MAX_SHARED_TEXT_LENGTH);
    expect(result.draft.warning).toContain('rút gọn');
  });

  it('accepts a local image URI without resolving it', () => {
    const result = normalizeIncomingShare([
      {
        value: 'content://com.android.providers.media.documents/image/42',
        mimeType: 'image/png',
        shareType: 'image',
      },
    ]);

    expect(result).toEqual({
      status: 'ready',
      draft: {
        kind: 'image',
        text: '',
        imageUri: 'content://com.android.providers.media.documents/image/42',
        mimeType: 'image/png',
      },
    });
  });

  it('refuses to fetch a remote image URL', () => {
    const result = normalizeIncomingShare([
      {
        value: 'https://lookalike-bank.example/qr.png',
        mimeType: 'image/png',
        shareType: 'image',
      },
    ]);

    expect(result.status).toBe('unsupported');
  });

  it('rejects multiple and unsupported payloads', () => {
    expect(
      normalizeIncomingShare([
        {value: 'one', mimeType: 'text/plain', shareType: 'text'},
        {value: 'two', mimeType: 'text/plain', shareType: 'text'},
      ]).status,
    ).toBe('unsupported');

    expect(
      normalizeIncomingShare([
        {value: 'file://voice.mp3', mimeType: 'audio/mpeg', shareType: 'audio'},
      ]).status,
    ).toBe('unsupported');
  });
});
