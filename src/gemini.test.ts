import {beforeEach, describe, expect, it, vi} from 'vitest';

const {analyze, getCapabilities, ping, createClient, TransportError, ProviderError} = vi.hoisted(() => {
  const analyze = vi.fn();
  const getCapabilities = vi.fn();
  const ping = vi.fn();
  class TransportError extends TypeError {}
  class ProviderError extends Error {
    retryable = true;
  }
  return {
    analyze,
    getCapabilities,
    ping,
    TransportError,
    ProviderError,
    createClient: vi.fn(() => ({analyze, getCapabilities, ping})),
  };
});

vi.mock('@scamsignal/api-client', () => ({
  ApiTransportError: TransportError,
  createScamSignalApiClient: createClient,
  ScamSignalApiError: ProviderError,
}));

import {analyzeWithGemini, getRedactionSummary, getRuntimeCapabilities, probeAnalysisTransport} from './gemini.js';

describe('Gemini web adapter', () => {
  beforeEach(() => {
    analyze.mockReset();
    getCapabilities.mockReset();
    ping.mockReset();
  });

  it('uses the bounded same-origin API client', () => {
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining({
      timeoutMs: 60_000,
    }));
  });

  it('redacts sensitive text before it reaches the server API', async () => {
    analyze.mockResolvedValue({score: 1});

    await analyzeWithGemini({
      message: 'OTP: 123456, mở https://novabarnk.vn',
      extraInfo: 'Password: unsafe-secret',
    });

    expect(analyze).toHaveBeenCalledWith({
      message: 'OTP: [ĐÃ ẨN], mở https://novabarnk.vn',
      extraInfo: 'Password: [ĐÃ ẨN]',
    });
  });

  it('reports a deduplicated local redaction summary for the UI', () => {
    expect(getRedactionSummary('OTP: 123456', 'Password: unsafe-secret')).toEqual({
      count: 2,
      kinds: ['otp', 'password'],
    });
  });

  it('falls back to transparent local checks when the AI Studio POST transport is unavailable', async () => {
    analyze.mockRejectedValue(new TransportError('Starting Server'));

    const result = await analyzeWithGemini({
      message: 'Xác minh OTP trong 10 phút tại https://novabarnk.vn/secure để tránh khóa tài khoản.',
      extraInfo: 'Tên miền chính thức: novabank.vn',
    });

    expect(result.level).toBe('Nguy hiểm');
    expect(result.pipeline.model).toBe('deterministic-safety-engine-v1');
    expect(result.score).toBe(0);
    expect(result.confidence).toBe(0);
  });

  it('skips the broken POST ingress when a probe already selected local analysis', async () => {
    const result = await analyzeWithGemini({
      message: 'Xác minh OTP trong 10 phút tại https://novabarnk.vn/secure để tránh khóa tài khoản.',
      extraInfo: 'Tên miền chính thức: novabank.vn',
    }, {preferLocal: true});

    expect(analyze).not.toHaveBeenCalled();
    expect(result.pipeline.model).toBe('deterministic-safety-engine-v1');
  });

  it('probes the analysis POST ingress independently from capability configuration', async () => {
    ping.mockResolvedValue(undefined);
    await expect(probeAnalysisTransport()).resolves.toBeUndefined();
    expect(ping).toHaveBeenCalledOnce();
  });

  it('delegates capability checks to the same-origin client', async () => {
    getCapabilities.mockResolvedValue({runtime: 'local'});
    await expect(getRuntimeCapabilities()).resolves.toEqual({runtime: 'local'});
    expect(getCapabilities).toHaveBeenCalledOnce();
  });
});
