import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import JSZip from 'jszip';
import { GoogleGenAI, type Part } from '@google/genai';

// ----------------------------------------------------------------------
// DATA TYPES
// ----------------------------------------------------------------------

export interface AiCitation {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface AiAttachmentRecord {
  id: string;
  fileName: string;
  kind: 'pdf' | 'docx' | 'pptx' | 'text' | 'image' | 'studyhub';
  mimeType: string;
  sizeBytes?: number;
  extractedText?: string;
  base64Data?: string;
}

export interface AiMessageRecord {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: 'openai' | 'gemini' | 'system';
  model?: string;
  fallbackUsed?: boolean;
  mode?: 'normal' | 'study';
  webSearch?: boolean;
  citations?: AiCitation[];
  attachments?: AiAttachmentRecord[];
  tokensUsed?: number;
  createdAt: string;
}

export interface AiConversationRecord {
  id: string;
  userId: string;
  title: string;
  mode: 'normal' | 'study';
  webSearchEnabled: boolean;
  modelPreference?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageSnippet?: string;
}

export interface AiDatabase {
  conversations: Record<string, AiConversationRecord>;
  messages: Record<string, AiMessageRecord[]>; // keyed by conversationId
  usageByUser: Record<string, { requestsToday: number; tokensToday: number; lastDate: string }>;
  feedback: Array<{
    id: string;
    messageId: string;
    userId: string;
    rating: 'up' | 'down';
    comment?: string;
    createdAt: string;
  }>;
  settings: {
    aiEnabled: boolean;
    defaultProvider: 'openai' | 'gemini';
    openaiModel: string;
    geminiModel: string;
    webSearchEnabled: boolean;
    studyModeEnabled: boolean;
    dailyLimitPerUser: number;
    emergencyShutdown: boolean;
  };
}

const DB_PATH = path.join(process.cwd(), '.kampus_ai_db.json');
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

// ----------------------------------------------------------------------
// DATABASE PERSISTENCE HELPERS
// ----------------------------------------------------------------------

function loadAiDatabase(): AiDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        conversations: parsed.conversations || {},
        messages: parsed.messages || {},
        usageByUser: parsed.usageByUser || {},
        feedback: parsed.feedback || [],
        settings: {
          aiEnabled: parsed.settings?.aiEnabled ?? true,
          defaultProvider: parsed.settings?.defaultProvider || 'openai',
          openaiModel: parsed.settings?.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini',
          geminiModel: parsed.settings?.geminiModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          webSearchEnabled: parsed.settings?.webSearchEnabled ?? true,
          studyModeEnabled: parsed.settings?.studyModeEnabled ?? true,
          dailyLimitPerUser: parsed.settings?.dailyLimitPerUser || 100,
          emergencyShutdown: parsed.settings?.emergencyShutdown ?? false,
        },
      };
    }
  } catch (err) {
    console.warn('[KAMPUS AI DB] Failed to parse database, initializing fresh store:', err);
  }

  const fresh: AiDatabase = {
    conversations: {},
    messages: {},
    usageByUser: {},
    feedback: [],
    settings: {
      aiEnabled: true,
      defaultProvider: (process.env.AI_DEFAULT_PROVIDER as 'openai' | 'gemini') || 'openai',
      openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      webSearchEnabled: true,
      studyModeEnabled: true,
      dailyLimitPerUser: 100,
      emergencyShutdown: false,
    },
  };
  saveAiDatabase(fresh);
  return fresh;
}

function saveAiDatabase(db: AiDatabase): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[KAMPUS AI DB] Error saving database:', err);
  }
}

// ----------------------------------------------------------------------
// USER AUTHENTICATION & USAGE TRACKING
// ----------------------------------------------------------------------

export function getAuthenticatedUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim();
    try {
      const decoded = jwt.decode(rawToken) as any;
      if (decoded && (decoded.sub || decoded.userId || decoded.id)) {
        return decoded.sub || decoded.userId || decoded.id;
      }
    } catch {
      // fallback
    }
  }

  const customHeader = req.headers['x-user-id'] || req.headers['x-clerk-user-id'];
  if (customHeader) {
    return String(customHeader).trim();
  }

  const queryOrBody = req.query?.userId || req.body?.userId;
  if (queryOrBody) {
    return String(queryOrBody).trim();
  }

  // Fallback guest identifier based on IP address
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  return 'usr_guest_' + crypto.createHash('md5').update(String(ip)).digest('hex').slice(0, 8);
}

function checkAndIncrementUsage(db: AiDatabase, userId: string, limit: number): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split('T')[0];
  if (!db.usageByUser[userId] || db.usageByUser[userId].lastDate !== today) {
    db.usageByUser[userId] = {
      requestsToday: 0,
      tokensToday: 0,
      lastDate: today,
    };
  }

  const usage = db.usageByUser[userId];
  if (usage.requestsToday >= limit) {
    return { allowed: false, remaining: 0 };
  }

  usage.requestsToday += 1;
  return { allowed: true, remaining: limit - usage.requestsToday };
}

// ----------------------------------------------------------------------
// PROVIDER CLIENTS & HELPERS
// ----------------------------------------------------------------------

function getOpenAiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key.startsWith('your_') || key === 'MY_OPENAI_API_KEY') {
    return null;
  }
  return key;
}

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key.startsWith('your_') || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
  });
}

function extractDomain(urlString: string): string {
  try {
    const u = new URL(urlString);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

// ----------------------------------------------------------------------
// DOCUMENT EXTRACTION UTILITIES
// ----------------------------------------------------------------------

function stripXmlTags(xml: string): string {
  return xml
    .replace(/<w:p[^>]*>/g, '\n')
    .replace(/<a:p[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function validateFileHeader(buffer: Buffer, ext: string): boolean {
  if (buffer.length === 0) return false;
  if (ext === '.pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (ext === '.docx' || ext === '.pptx') {
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }
  if (ext === '.png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8;
  }
  if (ext === '.webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  }
  return true;
}

// ----------------------------------------------------------------------
// PROMPT BUILDER FOR NORMAL & STUDY MODES
// ----------------------------------------------------------------------

function buildSystemInstruction(mode: 'normal' | 'study', webSearch: boolean, studentContext?: string): string {
  const base = [
    'You are KAMPUS AI, a world-class academic intelligence workspace for Indian college, university, and competitive exam students.',
    `Student Context: ${studentContext || 'Dedicated university scholar'}.`,
    'Always format answers beautifully with Markdown: clear headings (##, ###), bullet lists, bold highlights, LaTeX formulas where appropriate ($formula$), and code blocks with syntax highlighting.',
  ];

  if (webSearch) {
    base.push(
      'Live Web Search is active for this inquiry. Verify current data, statistics, syllabus revisions, or recent developments.',
      'Explicitly cite your sources with domain names or titles so the student can verify findings.'
    );
  }

  if (mode === 'study') {
    base.push(
      '=== STUDY MODE ACTIVE ===',
      'Adopt the role of an elite academic mentor and university professor:',
      '1. Step-by-Step Clarity: Break down complex topics into intuitive, bite-sized stages.',
      '2. Real-World Student Analogy: Provide a relatable physical or engineering intuition before diving into technical details.',
      '3. Core Formulations & Derivations: Explain the "why" and "how", not just final results.',
      '4. Common Exam Traps: Point out common misconceptions, edge-cases, or calculation pitfalls students frequently lose marks on.',
      '5. Active Recall Check: Conclude with 2 brief self-assessment questions or MCQs to test comprehension.'
    );
  } else {
    base.push(
      'Provide concise, accurate, and direct responses. Emphasize clarity and academic rigor without unnecessary verbosity.'
    );
  }

  return base.join('\n\n');
}

// ----------------------------------------------------------------------
// CORE MULTI-PROVIDER AI EXECUTION ENGINE
// ----------------------------------------------------------------------

interface ExecutionResult {
  content: string;
  provider: 'openai' | 'gemini';
  model: string;
  fallbackUsed: boolean;
  citations: AiCitation[];
}

async function executeAiGeneration(opts: {
  db: AiDatabase;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemInstruction: string;
  webSearch: boolean;
  attachments?: AiAttachmentRecord[];
}): Promise<ExecutionResult> {
  const { db, messages, systemInstruction, webSearch, attachments } = opts;
  const preferredProvider = db.settings.defaultProvider || 'openai';
  const openAiKey = getOpenAiKey();
  const geminiClient = getGeminiClient();

  const openAiModel = db.settings.openaiModel || 'gpt-4o-mini';
  const geminiModel = db.settings.geminiModel || 'gemini-2.5-flash';

  // Primary: OpenAI
  if (preferredProvider === 'openai') {
    if (openAiKey) {
      try {
        const result = await callOpenAi(openAiKey, openAiModel, messages, systemInstruction, webSearch, attachments);
        return {
          content: result.content,
          provider: 'openai',
          model: openAiModel,
          fallbackUsed: false,
          citations: result.citations,
        };
      } catch (openAiErr: any) {
        console.warn('[KAMPUS AI] Primary provider (OpenAI) encountered error:', openAiErr.message);
        if (geminiClient) {
          console.log('[KAMPUS AI] Initiating graceful fallback to Google Gemini...');
          try {
            const gemResult = await callGemini(geminiClient, geminiModel, messages, systemInstruction, webSearch, attachments);
            return {
              content: gemResult.content,
              provider: 'gemini',
              model: geminiModel,
              fallbackUsed: true,
              citations: gemResult.citations,
            };
          } catch (gemErr: any) {
            console.error('[KAMPUS AI] Secondary provider (Gemini) also failed:', gemErr.message);
            throw new Error(`AI providers temporarily unavailable. Primary error: ${openAiErr.message}`);
          }
        } else {
          throw openAiErr;
        }
      }
    } else if (geminiClient) {
      // OpenAI key not set, seamlessly run Gemini
      const gemResult = await callGemini(geminiClient, geminiModel, messages, systemInstruction, webSearch, attachments);
      return {
        content: gemResult.content,
        provider: 'gemini',
        model: geminiModel,
        fallbackUsed: false,
        citations: gemResult.citations,
      };
    }
  } else {
    // Primary: Gemini
    if (geminiClient) {
      try {
        const gemResult = await callGemini(geminiClient, geminiModel, messages, systemInstruction, webSearch, attachments);
        return {
          content: gemResult.content,
          provider: 'gemini',
          model: geminiModel,
          fallbackUsed: false,
          citations: gemResult.citations,
        };
      } catch (gemErr: any) {
        console.warn('[KAMPUS AI] Primary provider (Gemini) encountered error:', gemErr.message);
        if (openAiKey) {
          console.log('[KAMPUS AI] Initiating graceful fallback to OpenAI...');
          const result = await callOpenAi(openAiKey, openAiModel, messages, systemInstruction, webSearch, attachments);
          return {
            content: result.content,
            provider: 'openai',
            model: openAiModel,
            fallbackUsed: true,
            citations: result.citations,
          };
        } else {
          throw gemErr;
        }
      }
    } else if (openAiKey) {
      const result = await callOpenAi(openAiKey, openAiModel, messages, systemInstruction, webSearch, attachments);
      return {
        content: result.content,
        provider: 'openai',
        model: openAiModel,
        fallbackUsed: false,
        citations: result.citations,
      };
    }
  }

  throw new Error(
    'No AI provider credentials are configured on the server. Please set OPENAI_API_KEY or GEMINI_API_KEY in .env.'
  );
}

// ----------------------------------------------------------------------
// OPENAI API CALLER
// ----------------------------------------------------------------------

async function callOpenAi(
  apiKey: string,
  model: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemInstruction: string,
  webSearch: boolean,
  attachments?: AiAttachmentRecord[]
): Promise<{ content: string; citations: AiCitation[] }> {
  const formattedMessages: any[] = [{ role: 'system', content: systemInstruction }];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLastUser = i === messages.length - 1 && msg.role === 'user';

    let contentString = msg.content;
    if (isLastUser && attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (att.extractedText) {
          contentString += `\n\n[Attached Document: ${att.fileName}]\n${att.extractedText.slice(0, 25000)}`;
        }
      }
    }

    formattedMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: contentString,
    });
  }

  const payload: any = {
    model: model || 'gpt-4o-mini',
    messages: formattedMessages,
    temperature: 0.7,
    max_tokens: 4000,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    let parsedMsg = errBody;
    try {
      const j = JSON.parse(errBody);
      parsedMsg = j.error?.message || errBody;
    } catch {}
    throw new Error(`OpenAI API error (${response.status}): ${parsedMsg}`);
  }

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content || '';

  // Extract source URLs from text if web search was enabled
  const citations: AiCitation[] = [];
  if (webSearch) {
    const urlRegex = /https?:\/\/[^\s\)\],"]+/g;
    const matches = text.match(urlRegex) || [];
    const uniqueUrls: string[] = Array.from(new Set(matches));
    for (const url of uniqueUrls.slice(0, 4)) {
      citations.push({
        id: 'cit_' + crypto.randomUUID().slice(0, 8),
        title: extractDomain(url) + ' Reference',
        url,
        domain: extractDomain(url),
      });
    }
  }

  return { content: text.trim(), citations };
}

// ----------------------------------------------------------------------
// GEMINI API CALLER
// ----------------------------------------------------------------------

async function callGemini(
  client: GoogleGenAI,
  model: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemInstruction: string,
  webSearch: boolean,
  attachments?: AiAttachmentRecord[]
): Promise<{ content: string; citations: AiCitation[] }> {
  const contents = messages.map((msg, idx) => {
    const isLastUser = idx === messages.length - 1 && msg.role === 'user';
    const parts: Part[] = [{ text: msg.content }];

    if (isLastUser && attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (att.extractedText) {
          parts.push({
            text: `\n\n[Attached Document: ${att.fileName}]\n${att.extractedText.slice(0, 25000)}`,
          });
        } else if (att.base64Data && att.mimeType) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64Data,
            },
          });
        }
      }
    }

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });

  const config: any = {
    systemInstruction,
  };

  if (webSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await client.models.generateContent({
    model: model || 'gemini-2.5-flash',
    contents,
    config,
  });

  const text = response.text?.trim() || '';
  const citations: AiCitation[] = [];

  // Parse Google Search Grounding metadata
  const candidate = (response as any).candidates?.[0];
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
  if (Array.isArray(groundingChunks)) {
    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        citations.push({
          id: 'cit_' + crypto.randomUUID().slice(0, 8),
          title: chunk.web.title || extractDomain(chunk.web.uri),
          url: chunk.web.uri,
          domain: extractDomain(chunk.web.uri),
        });
      }
    }
  }

  // Fallback domain extraction if webSearch active but no grounding chunk was parsed
  if (webSearch && citations.length === 0) {
    const urlRegex = /https?:\/\/[^\s\)\],"]+/g;
    const matches = text.match(urlRegex) || [];
    const unique: string[] = Array.from(new Set(matches));
    for (const u of unique.slice(0, 4)) {
      citations.push({
        id: 'cit_' + crypto.randomUUID().slice(0, 8),
        title: extractDomain(u) + ' Reference',
        url: u,
        domain: extractDomain(u),
      });
    }
  }

  return { content: text, citations };
}

// ----------------------------------------------------------------------
// MAIN BACKEND REGISTRATION FUNCTION
// ----------------------------------------------------------------------

export function registerKampusAiBackend(app: Express): void {
  const db = loadAiDatabase();

  // 1. AI STATUS & HEALTH CHECK
  app.get('/api/ai/status', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const today = new Date().toISOString().split('T')[0];
    const userUsage = db.usageByUser[userId]?.lastDate === today ? db.usageByUser[userId].requestsToday : 0;
    const limit = db.settings.dailyLimitPerUser || 100;

    const openAiConfigured = Boolean(getOpenAiKey());
    const geminiConfigured = Boolean(getGeminiClient());
    const isAvailable = (openAiConfigured || geminiConfigured) && !db.settings.emergencyShutdown;

    return res.json({
      success: true,
      available: isAvailable,
      primaryProvider: db.settings.defaultProvider,
      fallbackEnabled: openAiConfigured && geminiConfigured,
      providers: {
        openai: {
          configured: openAiConfigured,
          model: db.settings.openaiModel,
        },
        gemini: {
          configured: geminiConfigured,
          model: db.settings.geminiModel,
        },
      },
      webSearchEnabled: db.settings.webSearchEnabled,
      studyModeEnabled: db.settings.studyModeEnabled,
      userQuota: {
        requestsToday: userUsage,
        dailyLimit: limit,
        remaining: Math.max(0, limit - userUsage),
      },
      message: isAvailable
        ? 'KAMPUS AI Workspace is online & ready.'
        : 'AI service credentials pending configuration.',
    });
  });

  // 2. CONVERSATIONS: LIST USER CONVERSATIONS
  app.get('/api/ai/conversations', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const userConvs = Object.values(db.conversations)
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return res.json({
      success: true,
      conversations: userConvs,
    });
  });

  // 3. CONVERSATIONS: CREATE NEW CONVERSATION
  app.post('/api/ai/conversations', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { title, mode = 'normal', webSearchEnabled = false } = req.body || {};

    const id = 'conv_' + Date.now() + '_' + crypto.randomUUID().slice(0, 6);
    const now = new Date().toISOString();

    const newConv: AiConversationRecord = {
      id,
      userId,
      title: (title || 'New Workspace Chat').trim(),
      mode: mode === 'study' ? 'study' : 'normal',
      webSearchEnabled: Boolean(webSearchEnabled),
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      lastMessageSnippet: '',
    };

    db.conversations[id] = newConv;
    db.messages[id] = [];
    saveAiDatabase(db);

    return res.json({
      success: true,
      conversation: newConv,
    });
  });

  // 4. CONVERSATIONS: GET SINGLE CONVERSATION WITH FULL MESSAGES
  app.get('/api/ai/conversations/:id', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const convId = req.params.id;
    const conv = db.conversations[convId];

    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    if (conv.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized conversation access.' });
    }

    const messages = db.messages[convId] || [];
    return res.json({
      success: true,
      conversation: conv,
      messages,
    });
  });

  // 5. CONVERSATIONS: UPDATE CONVERSATION METADATA
  app.patch('/api/ai/conversations/:id', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const convId = req.params.id;
    const conv = db.conversations[convId];

    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    if (conv.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized conversation access.' });
    }

    const { title, mode, webSearchEnabled } = req.body || {};
    if (title !== undefined) conv.title = String(title).trim();
    if (mode === 'normal' || mode === 'study') conv.mode = mode;
    if (webSearchEnabled !== undefined) conv.webSearchEnabled = Boolean(webSearchEnabled);
    conv.updatedAt = new Date().toISOString();

    saveAiDatabase(db);
    return res.json({ success: true, conversation: conv });
  });

  // 6. CONVERSATIONS: DELETE CONVERSATION
  app.delete('/api/ai/conversations/:id', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const convId = req.params.id;
    const conv = db.conversations[convId];

    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    if (conv.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized conversation access.' });
    }

    delete db.conversations[convId];
    delete db.messages[convId];
    saveAiDatabase(db);

    return res.json({ success: true, message: 'Conversation deleted successfully.' });
  });

  // 7. MULTI-TURN AI CHAT (PERSISTENT & PROVIDER-ABSTRACTION)
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const {
      conversationId,
      message,
      messages: clientMessages,
      mode = 'normal',
      webSearch = false,
      attachments = [],
      studentContext = '',
    } = req.body || {};

    if (!db.settings.aiEnabled || db.settings.emergencyShutdown) {
      return res.status(503).json({
        success: false,
        code: 'AI_DISABLED',
        message: 'KAMPUS AI is temporarily disabled for maintenance by administrators.',
      });
    }

    // Rate Limit Check
    const limit = db.settings.dailyLimitPerUser || 100;
    const usageCheck = checkAndIncrementUsage(db, userId, limit);
    if (!usageCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: 'DAILY_QUOTA_REACHED',
        message: `You have reached your daily quota of ${limit} AI queries. Quota resets at midnight.`,
      });
    }

    // Ensure or create conversation
    let convId = conversationId;
    let conv = convId ? db.conversations[convId] : null;

    if (!conv) {
      convId = 'conv_' + Date.now() + '_' + crypto.randomUUID().slice(0, 6);
      const now = new Date().toISOString();
      const initialTitle = message ? (message.length > 36 ? message.slice(0, 36) + '...' : message) : 'Workspace Session';
      conv = {
        id: convId,
        userId,
        title: initialTitle,
        mode: mode === 'study' ? 'study' : 'normal',
        webSearchEnabled: Boolean(webSearch),
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
        lastMessageSnippet: '',
      };
      db.conversations[convId] = conv;
      db.messages[convId] = [];
    } else if (conv.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized conversation access.' });
    }

    // Assemble conversation context
    const existingMessages = db.messages[convId] || [];
    let chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (Array.isArray(clientMessages) && clientMessages.length > 0) {
      chatHistory = clientMessages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || m.text || ''),
      }));
    } else {
      chatHistory = existingMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
      if (message) {
        chatHistory.push({ role: 'user', content: String(message) });
      }
    }

    if (chatHistory.length === 0) {
      return res.status(400).json({ success: false, message: 'No message prompt provided.' });
    }

    const lastUserPrompt = chatHistory[chatHistory.length - 1].content;
    const userMsgId = 'msg_' + Date.now() + '_u';
    const now = new Date().toISOString();

    // Store user message
    const userMsgRecord: AiMessageRecord = {
      id: userMsgId,
      conversationId: convId,
      role: 'user',
      content: lastUserPrompt,
      mode: conv.mode,
      webSearch: Boolean(webSearch),
      attachments,
      createdAt: now,
    };
    db.messages[convId].push(userMsgRecord);

    const systemInstruction = buildSystemInstruction(conv.mode, Boolean(webSearch), studentContext);

    try {
      const result = await executeAiGeneration({
        db,
        messages: chatHistory,
        systemInstruction,
        webSearch: Boolean(webSearch),
        attachments,
      });

      const aiMsgId = 'msg_' + Date.now() + '_a';
      const aiMsgRecord: AiMessageRecord = {
        id: aiMsgId,
        conversationId: convId,
        role: 'assistant',
        content: result.content,
        provider: result.provider,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
        mode: conv.mode,
        webSearch: Boolean(webSearch),
        citations: result.citations,
        createdAt: new Date().toISOString(),
      };

      db.messages[convId].push(aiMsgRecord);
      conv.updatedAt = new Date().toISOString();
      conv.messageCount = db.messages[convId].length;
      conv.lastMessageSnippet = result.content.slice(0, 80);
      saveAiDatabase(db);

      return res.json({
        success: true,
        conversationId: convId,
        reply: result.content,
        content: result.content,
        provider: result.provider,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
        citations: result.citations,
        remainingDailyQuota: usageCheck.remaining,
        message: aiMsgRecord,
      });
    } catch (err: any) {
      console.error('[KAMPUS AI CHAT ERROR]', err.message);
      return res.status(500).json({
        success: false,
        code: 'GENERATION_FAILED',
        message: err.message || 'Failed to generate AI response. Please retry in a moment.',
      });
    }
  });

  // 8. REAL SSE STREAMING CHAT (/api/ai/chat/stream)
  app.post('/api/ai/chat/stream', async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const {
      conversationId,
      message,
      messages: clientMessages,
      mode = 'normal',
      webSearch = false,
      attachments = [],
      studentContext = '',
    } = req.body || {};

    if (!db.settings.aiEnabled || db.settings.emergencyShutdown) {
      return res.status(503).json({
        success: false,
        message: 'KAMPUS AI is temporarily disabled for maintenance.',
      });
    }

    // Setup Server-Sent Events headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    let convId = conversationId;
    let conv = convId ? db.conversations[convId] : null;

    if (!conv) {
      convId = 'conv_' + Date.now() + '_' + crypto.randomUUID().slice(0, 6);
      const now = new Date().toISOString();
      conv = {
        id: convId,
        userId,
        title: message ? (message.length > 36 ? message.slice(0, 36) + '...' : message) : 'Workspace Session',
        mode: mode === 'study' ? 'study' : 'normal',
        webSearchEnabled: Boolean(webSearch),
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
        lastMessageSnippet: '',
      };
      db.conversations[convId] = conv;
      db.messages[convId] = [];
    }

    const chatHistory = (db.messages[convId] || []).map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }));
    if (message) {
      chatHistory.push({ role: 'user', content: String(message) });
      db.messages[convId].push({
        id: 'msg_' + Date.now() + '_u',
        conversationId: convId,
        role: 'user',
        content: String(message),
        mode: conv.mode,
        webSearch: Boolean(webSearch),
        attachments,
        createdAt: new Date().toISOString(),
      });
    }

    const systemInstruction = buildSystemInstruction(conv.mode, Boolean(webSearch), studentContext);
    let accumulatedContent = '';

    // Send start event
    res.write(
      `data: ${JSON.stringify({
        type: 'start',
        conversationId: convId,
        mode: conv.mode,
        webSearch: Boolean(webSearch),
      })}\n\n`
    );

    try {
      const result = await executeAiGeneration({
        db,
        messages: chatHistory,
        systemInstruction,
        webSearch: Boolean(webSearch),
        attachments,
      });

      // Stream words smoothly to client
      const words = result.content.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        accumulatedContent += chunk;
        res.write(`data: ${JSON.stringify({ type: 'delta', delta: chunk })}\n\n`);
      }

      if (result.citations && result.citations.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'citations', citations: result.citations })}\n\n`);
      }

      const aiMsgRecord: AiMessageRecord = {
        id: 'msg_' + Date.now() + '_a',
        conversationId: convId,
        role: 'assistant',
        content: result.content,
        provider: result.provider,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
        mode: conv.mode,
        webSearch: Boolean(webSearch),
        citations: result.citations,
        createdAt: new Date().toISOString(),
      };
      db.messages[convId].push(aiMsgRecord);
      conv.updatedAt = new Date().toISOString();
      conv.messageCount = db.messages[convId].length;
      conv.lastMessageSnippet = result.content.slice(0, 80);
      saveAiDatabase(db);

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          content: result.content,
          provider: result.provider,
          model: result.model,
          fallbackUsed: result.fallbackUsed,
          citations: result.citations,
        })}\n\n`
      );
      res.end();
    } catch (streamErr: any) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: streamErr.message || 'Stream generation failed.',
        })}\n\n`
      );
      res.end();
    }
  });

  // 9. DOCUMENT EXTRACTION & MULTIMODAL PARSING
  app.post('/api/ai/extract-document', async (req: Request, res: Response) => {
    try {
      const { fileName, mimeType, base64Data } = req.body as {
        fileName?: string;
        mimeType?: string;
        base64Data?: string;
      };

      if (!fileName || !base64Data) {
        return res.status(400).json({ error: 'INVALID_FILE', message: 'File name and data are required.' });
      }

      const ext = path.extname(fileName).toLowerCase();
      const allowedExts = ['.pdf', '.docx', '.pptx', '.txt', '.md', '.png', '.jpg', '.jpeg', '.webp'];
      if (!allowedExts.includes(ext)) {
        return res.status(400).json({
          error: 'UNSUPPORTED_FORMAT',
          message: `Unsupported file type "${ext}". Supported: PDF, DOCX, PPTX, TXT, PNG, JPG, WEBP.`,
        });
      }

      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');

      if (buffer.length === 0) {
        return res.status(400).json({ error: 'EMPTY_FILE', message: 'The uploaded file is empty.' });
      }
      if (buffer.length > MAX_UPLOAD_BYTES) {
        return res.status(400).json({
          error: 'FILE_TOO_LARGE',
          message: 'File exceeds the 10 MB upload limit.',
        });
      }

      if (!validateFileHeader(buffer, ext)) {
        return res.status(400).json({
          error: 'CORRUPTED_FILE',
          message: `The uploaded ${ext.toUpperCase()} file appears corrupted or invalid.`,
        });
      }

      if (ext === '.txt' || ext === '.md') {
        const text = buffer.toString('utf8').trim();
        return res.json({
          ok: true,
          fileName,
          kind: 'text',
          mimeType: mimeType || 'text/plain',
          extractedText: text.slice(0, 60000),
          pageOrSlideCount: Math.max(1, Math.ceil(text.length / 2200)),
        });
      }

      if (ext === '.docx') {
        const zip = await JSZip.loadAsync(buffer);
        const docXml = await zip.file('word/document.xml')?.async('string');
        const extracted = docXml ? stripXmlTags(docXml) : '';
        return res.json({
          ok: true,
          fileName,
          kind: 'docx',
          mimeType: 'text/plain',
          extractedText: extracted.slice(0, 60000),
          pageOrSlideCount: Math.max(1, Math.ceil(extracted.length / 2200)),
        });
      }

      if (ext === '.pptx') {
        const zip = await JSZip.loadAsync(buffer);
        const slideFiles = Object.keys(zip.files)
          .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
          .sort((a, b) => {
            const na = parseInt(a.match(/\d+/)?.[0] || '0', 10);
            const nb = parseInt(b.match(/\d+/)?.[0] || '0', 10);
            return na - nb;
          });

        const slidesText: string[] = [];
        for (let i = 0; i < slideFiles.length; i++) {
          const xml = await zip.file(slideFiles[i])?.async('string');
          const txt = xml ? stripXmlTags(xml) : '';
          if (txt) slidesText.push(`[Slide ${i + 1}]\n${txt}`);
        }
        return res.json({
          ok: true,
          fileName,
          kind: 'pptx',
          mimeType: 'text/plain',
          extractedText: slidesText.join('\n\n').slice(0, 60000),
          pageOrSlideCount: slideFiles.length,
        });
      }

      // PDF or Image
      const resolvedMime =
        ext === '.pdf'
          ? 'application/pdf'
          : ext === '.png'
          ? 'image/png'
          : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';

      return res.json({
        ok: true,
        fileName,
        kind: ext === '.pdf' ? 'pdf' : 'image',
        mimeType: resolvedMime,
        base64Data: cleanBase64,
        pageOrSlideCount: ext === '.pdf' ? undefined : 1,
      });
    } catch (err: any) {
      return res.status(400).json({
        error: 'DOCUMENT_PARSE_FAILED',
        message: err.message || 'Unable to process uploaded file.',
      });
    }
  });

  // 10. USER FEEDBACK (THUMBS UP / DOWN)
  app.post('/api/ai/feedback', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { messageId, rating, comment } = req.body || {};

    if (!messageId || (rating !== 'up' && rating !== 'down')) {
      return res.status(400).json({ success: false, message: 'Invalid feedback data.' });
    }

    db.feedback.push({
      id: 'fb_' + Date.now(),
      messageId,
      userId,
      rating,
      comment: comment ? String(comment).slice(0, 500) : undefined,
      createdAt: new Date().toISOString(),
    });
    saveAiDatabase(db);

    return res.json({ success: true, message: 'Feedback recorded. Thank you!' });
  });

  // 11. ADMIN CONFIGURATION (GET & PATCH)
  app.get('/api/ai/admin/config', (req: Request, res: Response) => {
    return res.json({
      success: true,
      settings: db.settings,
      stats: {
        totalConversations: Object.keys(db.conversations).length,
        totalMessages: Object.values(db.messages).reduce((acc, curr) => acc + curr.length, 0),
        feedbackCount: db.feedback.length,
      },
    });
  });

  app.patch('/api/ai/admin/config', (req: Request, res: Response) => {
    const patch = req.body || {};
    if (patch.aiEnabled !== undefined) db.settings.aiEnabled = Boolean(patch.aiEnabled);
    if (patch.defaultProvider === 'openai' || patch.defaultProvider === 'gemini') {
      db.settings.defaultProvider = patch.defaultProvider;
    }
    if (patch.openaiModel) db.settings.openaiModel = String(patch.openaiModel).trim();
    if (patch.geminiModel) db.settings.geminiModel = String(patch.geminiModel).trim();
    if (patch.webSearchEnabled !== undefined) db.settings.webSearchEnabled = Boolean(patch.webSearchEnabled);
    if (patch.studyModeEnabled !== undefined) db.settings.studyModeEnabled = Boolean(patch.studyModeEnabled);
    if (patch.dailyLimitPerUser !== undefined) db.settings.dailyLimitPerUser = Number(patch.dailyLimitPerUser);
    if (patch.emergencyShutdown !== undefined) db.settings.emergencyShutdown = Boolean(patch.emergencyShutdown);

    saveAiDatabase(db);
    return res.json({ success: true, settings: db.settings });
  });
}
