import type {UrlInspection} from '../packages/core/src/types.js';

type WebRiskPayload = {
  threat?: {
    threatTypes?: string[];
    expireTime?: string;
  };
};

async function checkUrl(url: string, apiKey: string): Promise<UrlInspection['webRisk']> {
  const endpoint = new URL('https://webrisk.googleapis.com/v1/uris:search');
  endpoint.searchParams.append('threatTypes', 'MALWARE');
  endpoint.searchParams.append('threatTypes', 'SOCIAL_ENGINEERING');
  endpoint.searchParams.append('threatTypes', 'UNWANTED_SOFTWARE');
  endpoint.searchParams.set('uri', url);
  endpoint.searchParams.set('key', apiKey);

  try {
    const response = await fetch(endpoint, {signal: AbortSignal.timeout(6000)});
    if (!response.ok) return {status: 'error', threatTypes: []};
    const payload = await response.json() as WebRiskPayload;
    const threatTypes = payload.threat?.threatTypes || [];
    return {
      status: threatTypes.length > 0 ? 'threat' : 'not_listed',
      threatTypes,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {status: 'error', threatTypes: []};
  }
}

export async function enrichWithWebRisk(inspections: UrlInspection[], apiKey: string) {
  if (!apiKey) return inspections;
  const results = await Promise.all(inspections.map((inspection) => checkUrl(inspection.normalizedUrl, apiKey)));
  return inspections.map((inspection, index) => ({...inspection, webRisk: results[index]}));
}
