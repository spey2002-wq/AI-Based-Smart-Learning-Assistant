require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenAI } = require('@google/genai');
const Cache = require('./models/Cache');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;
const MODEL = 'gemini-2.5-flash';
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learning_assistant';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

const VALID_MODES = ['explain', 'summary', 'quiz', 'revision'];

const systemPrompts = {
  explain:
    "You are an expert tutor. Break down the user's technical text or question into plain, highly accessible English using analogies. Avoid jargon.",
  summary:
    'Act as an academic editor. Convert the text into high-yield, concise bullet points and a concluding summary paragraph perfect for quick study sheets.',
  quiz:
    "Generate exactly 3 multiple-choice questions based on this text. Format your output strictly as a JSON array: [{question: '', options: ['', '', '', ''], correctIndex: 0}]. Do not output markdown code blocks.",
  revision:
    'Generate ultra-short, high-impact flashcard style key points that a student should memorize 10 minutes before sitting an exam.',
};

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function hashUserInput(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
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

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    model: MODEL,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    auth: Boolean(process.env.JWT_SECRET),
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'username, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'password must be at least 8 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    const token = jwt.sign({ sub: user._id.toString() }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `${field} is already taken` });
    }
    console.error('POST /api/auth/register', err);
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ sub: user._id.toString() }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error('POST /api/auth/login', err);
    res.status(500).json({ message: err.message || 'Login failed' });
  }
});

app.post('/api/learning/generate', async (req, res) => {
  try {
    const { mode, userInput } = req.body;

    if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
      return res.status(400).json({ message: 'userInput is required' });
    }

    const normalizedMode = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
    const systemInstruction = systemPrompts[normalizedMode];

    if (!systemInstruction) {
      return res.status(400).json({
        message: `mode must be one of: ${VALID_MODES.join(', ')}`,
      });
    }

    const trimmedInput = userInput.trim();
    const userInputHash = hashUserInput(trimmedInput);

    const cached = await Cache.findOne({
      mode: normalizedMode,
      userInputHash,
    });

    if (cached) {
      console.log(`Cache HIT — ${normalizedMode} (${userInputHash.slice(0, 8)}…)`);
      return res.json(
        buildPayload({
          mode: cached.mode,
          userInput: cached.userInput,
          content: cached.content,
          quiz: cached.quiz || undefined,
          format: cached.format,
          cached: true,
        })
      );
    }

    console.log(`Cache MISS — calling Gemini (${normalizedMode})`);

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

    return res.json(
      buildPayload({
        mode: normalizedMode,
        userInput: trimmedInput,
        content,
        quiz,
        format,
        cached: false,
      })
    );
  } catch (err) {
    console.error('POST /api/learning/generate', err);
    return res.status(500).json({
      message: err.message || 'Internal server error',
    });
  }
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Gemini model: ${MODEL}`);
    console.log(
      process.env.GOOGLE_API_KEY
        ? 'GOOGLE_API_KEY: connected'
        : 'GOOGLE_API_KEY: MISSING'
    );
    console.log(
      process.env.JWT_SECRET && process.env.JWT_SECRET !== 'change-this-secret-in-production'
        ? 'JWT auth: configured'
        : 'JWT auth: using default secret — set JWT_SECRET in .env'
    );
  });
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
