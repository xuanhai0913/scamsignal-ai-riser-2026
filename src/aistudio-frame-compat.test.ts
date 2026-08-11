import {describe, expect, it} from 'vitest';
import {isBrokenAiStudioScreenshotShimError} from './aistudio-frame-compat';

describe('AI Studio iframe compatibility guard', () => {
  it('matches only the known injected html2canvas parse error', () => {
    expect(isBrokenAiStudioScreenshotShimError(
      "Uncaught SyntaxError: Unexpected token 'export'",
      'https://cdn.jsdelivr.net/npm/html2canvas-pro',
    )).toBe(true);

    expect(isBrokenAiStudioScreenshotShimError(
      'Application failed to initialize',
      'https://cdn.jsdelivr.net/npm/html2canvas-pro',
    )).toBe(false);

    expect(isBrokenAiStudioScreenshotShimError(
      "Uncaught SyntaxError: Unexpected token 'export'",
      'https://example.com/app.js',
    )).toBe(false);
  });
});
