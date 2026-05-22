import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { buildUserMessage, getSystemInstruction } from '../utils/learningModes.js';

let client;

function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}

const MODE_CONFIG = {
  explain: { temperature: 0.65 },
  summary: { temperature: 0.5 },
  quiz: { temperature: 0.2 },
  revision: { temperature: 0.4 },
};

export async function generateLearningContent(mode, userInput) {
  const ai = getClient();
  const systemInstruction = getSystemInstruction(mode);
  const contents = buildUserMessage(userInput);
  const modeConfig = MODE_CONFIG[mode] || { temperature: 0.6 };

  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents,
    config: {
      systemInstruction,
      temperature: modeConfig.temperature,
      maxOutputTokens: 8192,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    const err = new Error('Gemini returned an empty response');
    err.status = 502;
    throw err;
  }

  return text;
}
