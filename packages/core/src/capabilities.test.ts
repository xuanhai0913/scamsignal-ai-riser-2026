import {describe, expect, it} from 'vitest';
import {
  createCapabilitiesResponseV1,
  parseCapabilitiesResponseV1,
  resolveAppRuntime,
} from './capabilities.js';

describe('runtime capability contract', () => {
  it('reports only capabilities configured by the current runtime', () => {
    const response = createCapabilitiesResponseV1({
      GEMINI_API_KEY: 'server-secret',
      GEMINI_MODEL: 'gemini-test',
      K_SERVICE: 'scamsignal',
    });

    expect(parseCapabilitiesResponseV1(response)).toEqual(response);
    expect(response).toMatchObject({
      runtime: 'cloud_run',
      analysis: {state: 'configured', model: 'gemini-test'},
      webRisk: {state: 'not_configured'},
      drive: {state: 'planned'},
    });
  });

  it('does not claim AI availability when the server key is missing', () => {
    expect(createCapabilitiesResponseV1({
      SCAMSIGNAL_RUNTIME: 'local',
      CONTACT_RESOLVER_ENABLED: 'true',
      GOOGLE_DRIVE_ENABLED: 'true',
      GOOGLE_CALENDAR_ENABLED: 'true',
    })).toMatchObject({
      runtime: 'local',
      analysis: {state: 'not_configured'},
      webRisk: {state: 'not_configured'},
      contactResolver: {state: 'planned'},
      drive: {state: 'planned'},
      calendar: {state: 'planned'},
    });
  });

  it('prefers an explicit valid runtime and rejects malformed payloads', () => {
    expect(resolveAppRuntime({SCAMSIGNAL_RUNTIME: 'ai_studio', K_SERVICE: 'ignored'})).toBe('ai_studio');
    expect(() => parseCapabilitiesResponseV1({apiVersion: 'v1', runtime: 'browser'})).toThrow('Runtime');
  });
});
