import {describe, expect, it} from 'vitest';
import {createAnalysisFixture} from '../test/analysis-fixture.js';
import {
  ANALYSIS_API_VERSION,
  ANALYSIS_REQUEST_LIMITS,
  ContractValidationError,
  createAnalysisResponseV1,
  parseAnalysisRequestV1,
  parseAnalysisResponseV1,
} from './api-contract.js';

describe('analysis API contract v1', () => {
  it('normalizes a valid text request without silently truncating it', () => {
    const request = parseAnalysisRequestV1({
      message: 'Kiểm tra https://novabarnk.vn/secure giúp tôi.',
      extraInfo: 'Tên miền đối chiếu: novabank.vn',
    });

    expect(request).toEqual({
      message: 'Kiểm tra https://novabarnk.vn/secure giúp tôi.',
      extraInfo: 'Tên miền đối chiếu: novabank.vn',
      imageDataUrl: undefined,
    });
  });

  it('accepts a supported image when the message is empty', () => {
    expect(parseAnalysisRequestV1({
      message: '',
      extraInfo: '',
      imageDataUrl: 'data:image/png;base64,aGVsbG8=',
    }).imageDataUrl).toContain('data:image/png');
  });

  it('rejects short text, unsupported images and oversized fields', () => {
    expect(() => parseAnalysisRequestV1({message: 'quá ngắn', extraInfo: ''}))
      .toThrow(ContractValidationError);
    expect(() => parseAnalysisRequestV1({
      message: '',
      extraInfo: '',
      imageDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
    })).toThrow('Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP.');
    expect(() => parseAnalysisRequestV1({
      message: 'x'.repeat(ANALYSIS_REQUEST_LIMITS.messageCharacters + 1),
      extraInfo: '',
    })).toThrow('Nội dung vượt quá');
    expect(() => parseAnalysisRequestV1({
      message: 'Nội dung đủ dài để kiểm tra contract.',
      extraInfo: '',
      unexpected: 'field',
    })).toThrow('request.unexpected');
  });

  it('round-trips a valid response envelope and rejects contract drift', () => {
    const response = createAnalysisResponseV1(createAnalysisFixture(), 'request-12345678');
    expect(parseAnalysisResponseV1(response)).toEqual(response);
    expect(response.apiVersion).toBe(ANALYSIS_API_VERSION);

    const invalidResponse = structuredClone(response) as unknown as Record<string, unknown>;
    const invalidAnalysis = invalidResponse.analysis as Record<string, unknown>;
    invalidAnalysis.score = 101;
    expect(() => parseAnalysisResponseV1(invalidResponse)).toThrow('analysis.score');
  });
});
