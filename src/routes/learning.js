import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { generateLearningContent } from '../services/gemini.js';
import {
  isValidMode,
  LEARNING_MODES,
  parseQuizResponse,
} from '../utils/learningModes.js';
import { env } from '../config/env.js';

const router = Router();
const MAX_INPUT_LENGTH = 12000;

router.post(
  '/generate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { mode, userInput } = req.body;

    if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
      return res.status(400).json({ message: 'userInput is required and must be a non-empty string' });
    }

    if (userInput.trim().length > MAX_INPUT_LENGTH) {
      return res.status(400).json({
        message: `userInput must not exceed ${MAX_INPUT_LENGTH} characters`,
      });
    }

    const normalizedMode = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
    if (!isValidMode(normalizedMode)) {
      return res.status(400).json({
        message: `mode must be one of: ${LEARNING_MODES.join(', ')}`,
      });
    }

    const content = await generateLearningContent(normalizedMode, userInput.trim());

    const payload = {
      success: true,
      mode: normalizedMode,
      userInput: userInput.trim(),
      model: env.geminiModel,
      content,
      format: normalizedMode === 'quiz' ? 'json' : 'markdown',
    };

    if (normalizedMode === 'quiz') {
      try {
        payload.quiz = parseQuizResponse(content);
      } catch (parseErr) {
        return res.status(502).json({
          message: `Quiz mode requires valid JSON from the model: ${parseErr.message}`,
          content,
        });
      }
    }

    res.json(payload);
  })
);

export default router;
