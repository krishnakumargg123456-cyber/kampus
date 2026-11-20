import {
  AiAttachment,
  AiLanguage,
  AiLearningLevel,
  AiResponseStyle,
  AiServiceStatus,
} from '../types/kampusAi';

export class AiServiceError extends Error {
  code: string;
  status: number;
  isUnavailable: boolean;

  constructor(message: string, code: string = 'AI_ERROR', status: number = 500) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.status = status;
    this.isUnavailable =
      code === 'AI_NOT_CONFIGURED' || code === 'AI_AUTH_ERROR' || status === 503;
  }
}

export async function fetchAiStatus(): Promise<AiServiceStatus> {
  try {
    const res = await fetch('/api/ai/status');
    if (!res.ok) {
      throw new Error(`Status check failed (${res.status})`);
    }
    const data = await res.json();
    return {
      ...data,
      checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return {
      available: false,
      model: 'gemini-4-hydrogen',
      provider: 'Server-Side Gemini API',
      maxUploadBytes: 10 * 1024 * 1024,
      supportedFormats: ['.pdf', '.docx', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.webp'],
      message: 'Unable to reach KAMPUS AI backend service.',
      checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file from device.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadAndExtractDocument(file: File): Promise<AiAttachment> {
  const maxBytes = 10 * 1024 * 1024;
  if (file.size === 0) {
    throw new AiServiceError('Selected file is empty.', 'EMPTY_FILE', 400);
  }
  if (file.size > maxBytes) {
    throw new AiServiceError('File exceeds the 10 MB upload limit.', 'FILE_TOO_LARGE', 400);
  }

  const base64Data = await fileToBase64(file);
  const res = await fetch('/api/ai/extract-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      base64Data,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AiServiceError(
      data.message || 'Unable to process uploaded document.',
      data.error || 'DOCUMENT_PARSE_FAILED',
      res.status
    );
  }

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    fileName: data.fileName,
    kind: data.kind,
    mimeType: data.mimeType,
    sizeBytes: file.size,
    pageOrSlideCount: data.pageOrSlideCount,
    extractedText: data.extractedText,
    base64Data: data.base64Data,
  };
}

export async function sendAiChatMessage(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  language: AiLanguage;
  learningLevel: AiLearningLevel;
  responseStyle: AiResponseStyle;
  studentContext?: string;
  attachments?: AiAttachment[];
  signal?: AbortSignal;
}): Promise<{ reply: string; model: string }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      messages: params.messages,
      language: params.language,
      learningLevel: params.learningLevel,
      responseStyle: params.responseStyle,
      studentContext: params.studentContext,
      attachments: (params.attachments || []).map((a) => ({
        fileName: a.fileName,
        mimeType: a.mimeType,
        base64Data: a.base64Data,
        extractedText: a.extractedText,
      })),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AiServiceError(
      data.message || 'AI chat request failed.',
      data.code || 'AI_REQUEST_FAILED',
      res.status
    );
  }
  return data;
}

export async function runStructuredAiTool<T>(
  tool: string,
  payload: Record<string, any>,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch('/api/ai/tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ tool, payload }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AiServiceError(
      json.message || 'Failed to generate AI output.',
      json.code || 'AI_REQUEST_FAILED',
      res.status
    );
  }
  return json.data as T;
}
