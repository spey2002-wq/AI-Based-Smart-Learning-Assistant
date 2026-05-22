import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { StudyHistory } from '../models/StudyHistory.js';

const router = Router();

const DEFAULT_HISTORY_MODES = ['explain', 'summary'];

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const modes = req.query.modes
      ? req.query.modes.split(',').map((m) => m.trim().toLowerCase())
      : DEFAULT_HISTORY_MODES;

    const history = await StudyHistory.find({
      user: req.user._id,
      mode: { $in: modes },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('mode userInput content format createdAt cached')
      .lean();

    res.json({
      success: true,
      history: history.map((item) => ({
        id: item._id,
        mode: item.mode,
        userInput: item.userInput,
        preview: item.userInput.slice(0, 120) + (item.userInput.length > 120 ? '…' : ''),
        content: item.content,
        format: item.format,
        cached: item.cached,
        createdAt: item.createdAt,
      })),
    });
  })
);

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await StudyHistory.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!item) {
      return res.status(404).json({ message: 'History item not found' });
    }

    res.json({
      success: true,
      item: {
        id: item._id,
        mode: item.mode,
        userInput: item.userInput,
        content: item.content,
        quiz: item.quiz,
        format: item.format,
        createdAt: item.createdAt,
      },
    });
  })
);

export default router;
