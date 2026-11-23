import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { GoogleGenAI, Type, type Part } from '@google/genai';
import { initializeDatabase, getDatabaseStatus, query } from './database/db.ts';
import { initializeAllModules } from './database/moduleStorage.ts';
import { registerAuthBackend } from './server/authBackend.ts';
import { registerChatBackend } from './server/chatBackend.ts';
import { registerStudyRoomsBackend } from './server/studyRoomsBackend.ts';
import { registerSkillSwapBackend } from './server/skillSwapBackend.ts';
import { registerCampusPulseBackend } from './server/campusPulseBackend.ts';
import { registerEventsClubsBackend } from './server/eventsClubsBackend.ts';
import { registerKampusIdBackend } from './server/kampusIdBackend.ts';
import { registerCareerBackend } from './server/careerBackend.ts';
import { registerStudentVoiceBackend } from './server/studentVoiceBackend.ts';
import { registerCollegeExplorerBackend } from './server/collegeExplorerBackend.ts';
import { registerMarketBackend } from './server/marketBackend.ts';
import { registerLockerBackend } from './server/lockerBackend.ts';
import { registerRewardsBackend } from './server/rewardsBackend.ts';
import { registerPlannerBackend } from './server/plannerBackend.ts';
import { registerNotificationsBackend } from './server/notificationsBackend.ts';
import { registerAccountProfileSettingsBackend } from './server/accountProfileSettingsBackend.ts';
import { registerSuperAdminBackend } from './server/superAdminBackend.ts';
import { registerStudyHubBackend } from './server/studyHubBackend.ts';
import { registerCommunityBackend } from './server/communityBackend.ts';
import { registerNotesExchangeBackend } from './server/notesExchangeBackend.ts';
import { registerStudyPartnerBackend } from './server/studyPartnerBackend.ts';
import { registerKampusAiBackend } from './server/kampusAiBackend.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_MODEL = 'gemini-4-hydrogen';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; code: string; message: string } {
  let rawMessage = err instanceof Error ? err.message : String(err);

  // Unwrap nested JSON error strings returned by @google/genai SDK
  try {
    if (rawMessage.trim().startsWith('{')) {
      const parsed = JSON.parse(rawMessage);
      if (parsed?.error?.message) {
        rawMessage = String(parsed.error.message);
      } else if (parsed?.message) {
        rawMessage = String(parsed.message);
      }
    }
  } catch {
    // keep rawMessage if not JSON
  }

  const lower = rawMessage.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403') || lower.includes('401')) {
    return {
      status: 403,
      code: 'AI_AUTH_ERROR',
      message:
        'Gemini API key is invalid or lacks permission. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      code: 'AI_QUOTA_EXCEEDED',
      message: 'AI request rate limit or quota reached. Please wait a moment and retry.',
    };
  }
  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand') || lower.includes('overloaded')) {
    return {
      status: 503,
      code: 'AI_TEMPORARILY_BUSY',
      message: 'The AI model is temporarily busy due to high demand. Please click Retry in a moment.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 502,
      code: 'AI_MODEL_ERROR',
      message: 'Requested Gemini model was unavailable. Please retry or check server configuration.',
    };
  }
  return {
    status: 500,
    code: 'AI_REQUEST_FAILED',
    message: rawMessage || 'Failed to generate AI response. Please retry.',
  };
}

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
    // ZIP archive magic bytes PK\x03\x04
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

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  app.use(cors());
  app.use(express.json({ limit: '16mb' }));

  // Serve static uploads for study materials, attachments, and student docs
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Initialize production database & schema
  await initializeDatabase();

  // Register Auth Backend with Real Email OTP & Passwords
  registerAuthBackend(app);

  const chatWss = registerChatBackend(app);
  const studyRoomsWss = registerStudyRoomsBackend(app);
  registerSkillSwapBackend(app);
  registerCampusPulseBackend(app);
  registerEventsClubsBackend(app);
  registerKampusIdBackend(app);
  registerCareerBackend(app);
  registerStudentVoiceBackend(app);
  registerCollegeExplorerBackend(app);
  registerMarketBackend(app);
  registerLockerBackend(app);
  registerRewardsBackend(app);
  registerPlannerBackend(app);
  const notificationsWss = registerNotificationsBackend(app);
  registerAccountProfileSettingsBackend(app);
  registerSuperAdminBackend(app);
  registerStudyHubBackend(app);
  registerCommunityBackend(app);
  registerNotesExchangeBackend(app);
  registerStudyPartnerBackend(app);

  // Initialize and synchronize all 21 module stores from PostgreSQL module_state
  await initializeAllModules();

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '/', 'http://localhost');
    if (url.pathname === '/ws/chat') {
      chatWss.handleUpgrade(request, socket, head, (ws) => {
        chatWss.emit('connection', ws, request);
      });
    } else if (url.pathname === '/ws/study-rooms') {
      studyRoomsWss.handleUpgrade(request, socket, head, (ws) => {
        studyRoomsWss.emit('connection', ws, request);
      });
    } else if (url.pathname === '/ws/notifications') {
      notificationsWss.handleUpgrade(request, socket, head, (ws) => {
        notificationsWss.emit('connection', ws, request);
      });
    }
  });

  // Register KAMPUS AI Full-Stack Engine (OpenAI + Gemini Fallback + Web Search + Document AI + Conversations + Streaming)
  registerKampusAiBackend(app);

  // 4. Structured Specialized AI Tools
  app.post('/api/ai/tool', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        code: 'AI_NOT_CONFIGURED',
        message:
          'KAMPUS AI is unavailable because Gemini API credentials are not configured on the server.',
      });
    }

    const { tool, payload } = req.body as { tool: string; payload: Record<string, any> };
    if (!tool || !payload) {
      return res.status(400).json({ code: 'INVALID_INPUT', message: 'Missing tool or payload.' });
    }

    try {
      const langRule = `Respond in ${payload.language || 'English'} (if Hinglish, use natural conversational Hindi in Latin script mixed with accurate English technical terms).`;
      const levelRule = `Target academic level: ${payload.learningLevel || 'Intermediate'}.`;

      if (tool === 'explain-topic') {
        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: `Explain the topic "${payload.topic}" in subject "${payload.subject}" for "${payload.courseOrClass}". ${payload.modifier ? `Instruction: ${payload.modifier}` : ''}`,
          config: {
            systemInstruction: `You are KAMPUS AI Topic Explainer. ${langRule} ${levelRule} Return comprehensive, accurate academic explanations structured cleanly into the requested JSON schema.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                introduction: { type: Type.STRING },
                simpleDefinition: { type: Type.STRING },
                detailedExplanation: { type: Type.STRING },
                importantConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                stepByStepBreakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
                realLifeExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
                importantFormulas: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                quickRevisionSummary: { type: Type.STRING },
              },
              required: [
                'introduction',
                'simpleDefinition',
                'detailedExplanation',
                'importantConcepts',
                'stepByStepBreakdown',
                'realLifeExamples',
                'importantFormulas',
                'keyPoints',
                'commonMistakes',
                'quickRevisionSummary',
              ],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      if (tool === 'generate-notes') {
        const parts: Part[] = [
          {
            text: `Create study notes for Topic/Chapter: "${payload.topic}", Subject: "${payload.subject}", Course/Semester: "${payload.courseSemester}", Length: "${payload.notesLength}", Difficulty: "${payload.difficulty}".`,
          },
        ];
        if (payload.materialText) {
          parts.push({ text: `\n\nSource Study Material:\n${String(payload.materialText).slice(0, 30000)}` });
        }
        if (payload.attachment?.base64Data) {
          parts.push({
            inlineData: {
              mimeType: payload.attachment.mimeType,
              data: payload.attachment.base64Data,
            },
          });
        }

        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: { parts },
          config: {
            systemInstruction: `You are KAMPUS AI Notes Generator. ${langRule} Produce high-utility collegiate/school study notes with complete notes, short revision notes, exam-oriented notes, definitions, concepts, formulas, text diagram explanation, important questions, and quick revision bullets.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                completeNotes: { type: Type.STRING },
                shortRevisionNotes: { type: Type.STRING },
                examOrientedNotes: { type: Type.STRING },
                definitions: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                formulas: { type: Type.ARRAY, items: { type: Type.STRING } },
                diagramExplanation: { type: Type.STRING },
                importantQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                quickRevisionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'title',
                'completeNotes',
                'shortRevisionNotes',
                'examOrientedNotes',
                'definitions',
                'keyConcepts',
                'formulas',
                'diagramExplanation',
                'importantQuestions',
                'quickRevisionPoints',
              ],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      if (tool === 'generate-quiz') {
        const count = Math.min(15, Math.max(1, Number(payload.count) || 5));
        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: `Generate ${count} practice questions for Subject: "${payload.subject}", Chapter: "${payload.chapter || 'Core'}", Topic: "${payload.topic}", Difficulty: "${payload.difficulty}", Question Type: "${payload.questionType}".
For MCQ: provide exactly 4 options and set correctAnswer equal to one option.
For MSQ: provide 4 options and set correctAnswers array to the correct options.
For True/False: provide options ["True", "False"] and correctAnswer "True" or "False".
For Fill in the Blanks: include ______ in the question and set correctAnswer to the concise expected blank.
For Short Answer: set modelAnswer to a concise scoring answer.`,
          config: {
            systemInstruction: `You are KAMPUS AI Quiz Generator. ${langRule} Ensure every question is academically accurate, unambiguous, and accompanied by a clear explanation and topicTag.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                      topicTag: { type: Type.STRING },
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswer: { type: Type.STRING },
                      correctAnswers: { type: Type.ARRAY, items: { type: Type.STRING } },
                      modelAnswer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['id', 'type', 'difficulty', 'topicTag', 'question', 'explanation'],
                  },
                },
              },
              required: ['title', 'questions'],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      if (tool === 'solve-question') {
        const parts: Part[] = [
          {
            text: `Subject: ${payload.subject || 'General'}.\nQuestion / Prompt: ${payload.questionText || '(See attached file/image)'}\n${payload.modifier ? `Additional instruction: ${payload.modifier}` : ''}`,
          },
        ];
        if (payload.extractedText) {
          parts.push({ text: `\n\nExtracted Document Text:\n${String(payload.extractedText).slice(0, 25000)}` });
        }
        if (payload.attachment?.base64Data) {
          parts.push({
            inlineData: {
              mimeType: payload.attachment.mimeType,
              data: payload.attachment.base64Data,
            },
          });
        }

        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: { parts },
          config: {
            systemInstruction: `You are KAMPUS AI Question Solver. ${langRule} ${levelRule}
CRITICAL RULE: Never invent missing numbers, cropped symbols, or fabricated answers when a question is unclear or illegible. If anything necessary to solve the problem is ambiguous or missing, set needsClarification = true and write a clear clarificationPrompt explaining what is needed.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                needsClarification: { type: Type.BOOLEAN },
                clarificationPrompt: { type: Type.STRING },
                questionUnderstanding: { type: Type.STRING },
                relevantConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                formulas: { type: Type.ARRAY, items: { type: Type.STRING } },
                solutionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                finalAnswer: { type: Type.STRING },
                whyCorrect: { type: Type.STRING },
              },
              required: [
                'needsClarification',
                'clarificationPrompt',
                'questionUnderstanding',
                'relevantConcepts',
                'formulas',
                'solutionSteps',
                'finalAnswer',
                'whyCorrect',
              ],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      if (tool === 'analyze-document') {
        const parts: Part[] = [
          {
            text: `Document Name: "${payload.fileName}"\nRequested Action: ${payload.action}\n${payload.userQuestion ? `User Question: ${payload.userQuestion}` : ''}`,
          },
        ];
        if (payload.extractedText) {
          parts.push({ text: `\n\nDocument Content:\n${String(payload.extractedText).slice(0, 45000)}` });
        } else if (payload.base64Data && payload.mimeType) {
          parts.push({
            inlineData: {
              mimeType: payload.mimeType,
              data: payload.base64Data,
            },
          });
        } else {
          return res.status(400).json({
            code: 'NO_DOCUMENT_CONTENT',
            message: 'Document was not processed or contains no readable content.',
          });
        }

        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: { parts },
          config: {
            systemInstruction: `You are KAMPUS Document Intelligence AI. ${langRule}
Strictly base your analysis on the actual uploaded document content provided. Include page or slide references (e.g., "Page 2" or "Slide 3") whenever identifiable. Never fabricate facts outside the document without explicitly noting it.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                markdownOutput: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                references: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['title', 'markdownOutput', 'keyPoints', 'references'],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      if (tool === 'generate-flashcards') {
        const count = Math.min(20, Math.max(2, Number(payload.count) || 8));
        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: `Generate ${count} high-yield study flashcards from:\nSource Type: ${payload.sourceType}\nTitle/Topic: ${payload.topic}\nSource Text:\n${String(payload.sourceText || '').slice(0, 25000)}`,
          config: {
            systemInstruction: `You are KAMPUS AI Flashcard Studio. ${langRule} Each card needs a clear, testable front prompt, concise accurate back explanation, optional hint, and difficulty ("Easy" | "Medium" | "Hard").`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                deckTitle: { type: Type.STRING },
                cards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      front: { type: Type.STRING },
                      back: { type: Type.STRING },
                      hint: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                    },
                    required: ['front', 'back', 'difficulty'],
                  },
                },
              },
              required: ['deckTitle', 'cards'],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      if (tool === 'exam-prep') {
        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: `Create an exam preparation roadmap for:
Exam: ${payload.examName}
Subject: ${payload.subject}
Topics: ${payload.topics}
Exam Date: ${payload.examDate}
Available Daily Hours: ${payload.dailyHours}
Current Preparation Level: ${payload.prepLevel}`,
          config: {
            systemInstruction: `You are KAMPUS Exam Preparation Assistant. ${langRule}
CRITICAL ACADEMIC INTEGRITY RULES:
1. Never claim any topic is guaranteed to appear on an exam.
2. Explicitly distinguish general/official syllabus framing from AI-generated study recommendations.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                officialSyllabusBoundaryNote: { type: Type.STRING },
                disclaimer: { type: Type.STRING },
                dailyTargets: { type: Type.ARRAY, items: { type: Type.STRING } },
                weeklyTimetable: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      day: { type: Type.STRING },
                      focus: { type: Type.STRING },
                      hours: { type: Type.STRING },
                    },
                    required: ['day', 'focus', 'hours'],
                  },
                },
                importantTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                revisionSchedule: { type: Type.ARRAY, items: { type: Type.STRING } },
                practiceRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'officialSyllabusBoundaryNote',
                'disclaimer',
                'dailyTargets',
                'weeklyTimetable',
                'importantTopics',
                'revisionSchedule',
                'practiceRecommendations',
              ],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      if (tool === 'study-planner') {
        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: `Create a personalized study plan:
Goals: ${payload.goals}
Subjects: ${payload.subjects}
Available Hours/Day: ${payload.availableHours}
Exam Deadlines: ${payload.deadlines}
Weak Subjects: ${payload.weakSubjects}
Preferred Schedule: ${payload.preferredSchedule}`,
          config: {
            systemInstruction: `You are KAMPUS Smart Study Planner. ${langRule} Build realistic, balanced schedules with subject-wise allocation, revision blocks, practice sessions, and healthy break recommendations.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                dailyPlan: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timeSlot: { type: Type.STRING },
                      task: { type: Type.STRING },
                      subject: { type: Type.STRING },
                      type: { type: Type.STRING },
                    },
                    required: ['timeSlot', 'task', 'subject', 'type'],
                  },
                },
                weeklyTimetable: { type: Type.ARRAY, items: { type: Type.STRING } },
                subjectAllocation: { type: Type.ARRAY, items: { type: Type.STRING } },
                revisionSessions: { type: Type.ARRAY, items: { type: Type.STRING } },
                practiceSessions: { type: Type.ARRAY, items: { type: Type.STRING } },
                breakRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'title',
                'dailyPlan',
                'weeklyTimetable',
                'subjectAllocation',
                'revisionSessions',
                'practiceSessions',
                'breakRecommendations',
              ],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      if (tool === 'ask-my-notes') {
        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: `Student Question / Action (${payload.action}): "${payload.question}"\n\nSelected Study Hub Notes & Materials:\n${String(payload.notesContext || '').slice(0, 35000)}`,
          config: {
            systemInstruction: `You are KAMPUS Personal Knowledge Assistant. ${langRule}
CRITICAL: Clearly separate what is explicitly found in the student's selected notes ("foundInNotes") from any supplementary explanation you add ("additionalAiExplanation"). Cite the exact note titles in "sourceReferences".`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                foundInNotes: { type: Type.STRING },
                additionalAiExplanation: { type: Type.STRING },
                sourceReferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                generatedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'foundInNotes',
                'additionalAiExplanation',
                'sourceReferences',
                'generatedQuestions',
              ],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      if (tool === 'planner-assistant') {
        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: `Student Request Type: ${payload.requestType}
Today's Date: ${payload.todayISO}
Prompt / Context: ${payload.userPrompt || 'Organize my upcoming academic schedule.'}
Current Tasks & Deadlines Summary:
${String(payload.plannerContext || 'No tasks yet').slice(0, 12000)}`,
          config: {
            systemInstruction: `You are KAMPUS AI Planner Assistant. Generate practical, realistic, editable student productivity items matching the request type (weekly-study-plan, organize-today, break-goal, exam-revision, balanced-timetable, overloaded-days, or reschedule-unfinished).
Use valid YYYY-MM-DD dates anchored to Today's Date (${payload.todayISO}), HH:MM 24h times, and valid TaskCategory ("Study" | "Assignments" | "Examinations" | "Projects" | "Career" | "Personal" | "College" | "Other").`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summaryTitle: { type: Type.STRING },
                adviceNote: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      kind: { type: Type.STRING },
                      title: { type: Type.STRING },
                      category: { type: Type.STRING },
                      dateISO: { type: Type.STRING },
                      startTime: { type: Type.STRING },
                      endTime: { type: Type.STRING },
                      estimatedMinutes: { type: Type.INTEGER },
                      priority: { type: Type.STRING },
                      notes: { type: Type.STRING },
                    },
                    required: [
                      'kind',
                      'title',
                      'category',
                      'dateISO',
                      'startTime',
                      'endTime',
                      'estimatedMinutes',
                      'priority',
                      'notes',
                    ],
                  },
                },
              },
              required: ['summaryTitle', 'adviceNote', 'items'],
            },
          },
        });
        return res.json({ data: JSON.parse((response.text ?? '{}').trim()) });
      }

      return res.status(400).json({ code: 'UNKNOWN_TOOL', message: `Unknown AI tool: ${tool}` });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ code: formatted.code, message: formatted.message });
    }
  });

  // System Health & Database Readiness Verification (Zero secret exposure)
  app.get('/api/health', async (_req, res) => {
    const dbStatus = getDatabaseStatus();
    let tablesChecked = 0;
    let schemaReady = false;

    if (dbStatus.isPostgresConnected) {
      try {
        const checkRes = await query(
          `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'`
        );
        tablesChecked = parseInt(checkRes.rows[0].count, 10);
        schemaReady = tablesChecked >= 20;
      } catch {
        schemaReady = false;
      }
    }

    res.json({
      ok: true,
      service: 'kampus-api',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        engine: dbStatus.engine,
        connected: dbStatus.isPostgresConnected,
        poolActive: dbStatus.poolActive,
        environment: dbStatus.environment,
        schemaReady: dbStatus.isPostgresConnected ? schemaReady : true,
        tablesCount: tablesChecked,
      },
    });
  });

  app.all('/api/*', (req, res) => {
    res.status(404).json({
      code: 'API_NOT_FOUND',
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Vite dev middleware or static production build
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static workspace images in production for any persisted DB /src/assets/images/* URLs
    app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`KAMPUS server running on http://0.0.0.0:${port}`);
  });
}

startServer();
