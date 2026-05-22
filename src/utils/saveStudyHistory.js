import { StudyHistory } from '../models/StudyHistory.js';

export async function saveStudyHistory(userId, payload) {
  if (!userId) return;

  await StudyHistory.create({
    user: userId,
    mode: payload.mode,
    userInput: payload.userInput,
    content: payload.content,
    quiz: payload.quiz || null,
    format: payload.format || 'markdown',
    cached: Boolean(payload.cached),
  });
}
