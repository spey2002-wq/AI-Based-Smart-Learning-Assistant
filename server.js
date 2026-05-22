
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root, then fall back to backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.GOOGLE_API_KEY && existsSync(path.join(__dirname, 'backend', '.env'))) {
  dotenv.config({ path: path.join(__dirname, 'backend', '.env') });
}
// Support older env name
if (!process.env.GOOGLE_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}
import cors from 'cors';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { Cache } from './src/models/Cache.js';
import { optionalAuth } from './src/middleware/optionalAuth.js';
import authRoutes from './src/routes/auth.js';
import historyRoutes from './src/routes/history.js';
import { hashUserInput } from './src/utils/hashInput.js';
import { saveStudyHistory } from './src/utils/saveStudyHistory.js';

const PORT = process.env.PORT || 5000;
const MODEL = 'gemini-2.5-flash';
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-learning-assistant';

const VALID_MODES = ['explain', 'summary', 'quiz', 'revision'];

const systemPrompts = {
  explain:
    "You are an expert tutor. Break down the user's technical text or question into plain, highly accessible English using analogies. Avoid jargon.",
  summary:
    'Act as an academic editor. Convert the text into high-yield, concise bullet points and a concluding summary paragraph perfect for quick study sheets.',
  quiz:
    "Generate exactly 3 multiple-choice questions based on this text. Format your output strictly as a JSON array so my frontend can read it: [{question: '', options: ['', '', '', ''], correctIndex: 0}]. Do not output markdown code blocks.",
  revision:
    'Generate ultra-short, high-impact flashcard style key points that a student should memorize 10 minutes before sitting an exam.',
};

function getSystemInstruction(mode) {
  const key = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
  return systemPrompts[key] ?? null;
}

let aiClient;

function getAI() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not set in environment variables');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

function parseQuizJson(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}

function buildPayload({ mode, userInput, content, quiz, format, cached }) {
  const payload = {
    success: true,
    mode,
    userInput,
    model: MODEL,
    content,
    format: format || (mode === 'quiz' ? 'json' : 'markdown'),
    cached: Boolean(cached),
  };
  if (quiz) payload.quiz = quiz;
  return payload;
}

const app = express();

app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    model: MODEL,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    auth: Boolean(process.env.JWT_SECRET),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);

app.post('/api/learning/generate', optionalAuth, async (req, res) => {
  try {
    const { mode, userInput } = req.body;

    if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
      return res.status(400).json({ message: 'userInput is required' });
    }

    const normalizedMode = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
    const systemInstruction = getSystemInstruction(normalizedMode);

    if (!systemInstruction) {
      return res.status(400).json({
        message: `mode must be one of: ${VALID_MODES.join(', ')}`,
      });
    }

    const trimmedInput = userInput.trim();
    const userInputHash = hashUserInput(trimmedInput);

    const cached = await Cache.findOne({ mode: normalizedMode, userInputHash });

    if (cached) {
      console.log(`Cache HIT — ${normalizedMode} (${userInputHash.slice(0, 8)}…)`);
      const payload = buildPayload({
        mode: cached.mode,
        userInput: cached.userInput,
        content: cached.content,
        quiz: cached.quiz || undefined,
        format: cached.format,
        cached: true,
      });
      if (req.user) {
        await saveStudyHistory(req.user._id, payload);
      }
      return res.json(payload);
    }

    console.log(`Cache MISS — calling Gemini (${normalizedMode})`);

    const ai = getAI();

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: trimmedInput,
      config: {
        systemInstruction,
        temperature: normalizedMode === 'quiz' ? 0.2 : 0.65,
        maxOutputTokens: 8192,
      },
    });

    const content = response.text?.trim();
    if (!content) {
      return res.status(502).json({ message: 'Model returned an empty response' });
    }

    let quiz;
    let format = 'markdown';

    if (normalizedMode === 'quiz') {
      try {
        quiz = parseQuizJson(content);
        format = 'json';
      } catch {
        return res.status(502).json({
          message: 'Quiz mode requires valid JSON output from the model',
          content,
        });
      }
    }

    await Cache.findOneAndUpdate(
      { mode: normalizedMode, userInputHash },
      {
        mode: normalizedMode,
        userInputHash,
        userInput: trimmedInput,
        content,
        quiz: quiz || null,
        format,
        model: MODEL,
      },
      { upsert: true, new: true }
    );

    const payload = buildPayload({
      mode: normalizedMode,
      userInput: trimmedInput,
      content,
      quiz,
      format,
      cached: false,
    });

    if (req.user) {
      await saveStudyHistory(req.user._id, payload);
    }

    return res.json(payload);
  } catch (err) {
    console.error('POST /api/learning/generate', err);
    return res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);

  app.listen(PORT, () => {
    const keyLoaded = Boolean(process.env.GOOGLE_API_KEY?.trim());
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Gemini model: ${MODEL}`);
    console.log(
      keyLoaded
        ? 'GOOGLE_API_KEY: connected'
        : 'GOOGLE_API_KEY: MISSING — add it to .env in the project root (see .env.example)'
    );
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
