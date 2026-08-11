import {
  ANALYSIS_RESPONSE_SCHEMA,
  buildAnalysisPrompt,
  finalizeAnalysis,
  IMAGE_EXTRACTION_SCHEMA,
  SYSTEM_INSTRUCTION,
} from './analysis-contract.js';
import type {AnalyzeRequest, AnalysisPipeline, UrlInspection} from './types.js';

type ImageExtraction = {
  visibleText: string;
  urls: string[];
  referenceDomains: string[];
};

const GEMINI_HTTP_OPTIONS = {
  timeout: 25_000,
  retryOptions: {attempts: 1},
} as const;

function parseImageDataUrl(imageDataUrl: string) {
  const [metadata, data] = imageDataUrl.split(',', 2);
  if (!data) throw new Error('Ảnh tải lên không hợp lệ.');
  return {
    data,
    mimeType: metadata.match(/^data:([^;]+)/u)?.[1] || 'image/png',
  };
}

export async function extractImageSignals(options: {
  apiKey: string;
  model: string;
  imageDataUrl: string;
}): Promise<ImageExtraction> {
  const {GoogleGenAI} = await import('@google/genai');
  const client = new GoogleGenAI({apiKey: options.apiKey});
  const image = parseImageDataUrl(options.imageDataUrl);
  const response = await client.models.generateContent({
    model: options.model,
    contents: [{
      role: 'user',
      parts: [
        {text: 'Trích xuất nguyên văn phần chữ nhìn thấy, tất cả URL/domain và tên miền chính thức được nêu rõ trong ảnh. Không mở hoặc truy cập URL. Chỉ trả về JSON thuần đúng dạng {"visibleText":"...","urls":["..."],"referenceDomains":["..."]}.'},
        {inlineData: image},
      ],
    }] as never,
    config: {
      abortSignal: AbortSignal.timeout(25_000),
      httpOptions: GEMINI_HTTP_OPTIONS,
      responseMimeType: 'application/json',
      responseJsonSchema: IMAGE_EXTRACTION_SCHEMA,
      temperature: 0,
    },
  });
  const text = String(response.text || '').trim();
  if (!text) return {visibleText: '', urls: [], referenceDomains: []};
  const payload = JSON.parse(text) as Partial<ImageExtraction>;
  return {
    visibleText: typeof payload.visibleText === 'string' ? payload.visibleText.slice(0, 4000) : '',
    urls: Array.isArray(payload.urls) ? payload.urls.filter((item): item is string => typeof item === 'string').slice(0, 5) : [],
    referenceDomains: Array.isArray(payload.referenceDomains)
      ? payload.referenceDomains.filter((item): item is string => typeof item === 'string').slice(0, 3)
      : [],
  };
}

export async function generateGeminiAnalysis(options: {
  apiKey: string;
  model: string;
  request: AnalyzeRequest;
  extractedImageText?: string;
  urlInspections: UrlInspection[];
  referenceDomains: string[];
  pipeline: AnalysisPipeline;
}) {
  const {GoogleGenAI} = await import('@google/genai');
  const client = new GoogleGenAI({apiKey: options.apiKey});
  const parts: Array<Record<string, unknown>> = [{
    text: buildAnalysisPrompt({
      message: options.request.message,
      extraInfo: options.request.extraInfo,
      extractedImageText: options.extractedImageText,
      urlInspections: options.urlInspections,
    }),
  }];
  const response = await client.models.generateContent({
    model: options.model,
    contents: [{role: 'user', parts}] as never,
    config: {
      abortSignal: AbortSignal.timeout(25_000),
      httpOptions: GEMINI_HTTP_OPTIONS,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
      temperature: 0.15,
    },
  });
  const text = String(response.text || '').trim();
  if (!text) throw new Error('Gemini chưa trả về kết quả.');

  try {
    return finalizeAnalysis(JSON.parse(text), {
      urlInspections: options.urlInspections,
      referenceDomains: options.referenceDomains,
      hasImageEvidence: Boolean(options.extractedImageText?.trim()),
      pipeline: options.pipeline,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Gemini trả về dữ liệu chưa đúng định dạng. Vui lòng thử lại.');
    }
    throw error;
  }
}
