export const LEARNING_MODES = ['explain', 'summary', 'quiz', 'revision'];

/**
 * Specialized system prompts — each mode routes through a distinct pedagogical filter.
 */
export const systemPrompts = {
  explain:
    "You are an expert tutor. Break down the user's technical text or question into plain, highly accessible English using analogies. Avoid jargon.",
  summary:
    'Act as an academic editor. Convert the text into high-yield, concise bullet points and a concluding summary paragraph perfect for quick study sheets.',
  quiz:
    "Generate exactly 3 multiple-choice questions based on this text. Format your output strictly as a JSON array so my frontend can read it: [{question: '', options: ['', '', '', ''], correct: 0}]. Do not output markdown code blocks.",
  revision:
    'Generate ultra-short, high-impact flashcard style key points that a student should memorize 10 minutes before sitting an exam.',
};

export function isValidMode(mode) {
  return typeof mode === 'string' && LEARNING_MODES.includes(mode.trim().toLowerCase());
}

export function getSystemInstruction(mode) {
  const key = mode.trim().toLowerCase();
  return systemPrompts[key];
}

export function buildUserMessage(userInput) {
  return userInput.trim();
}

/**
 * Parse and validate quiz JSON from model output (strips accidental code fences).
 */
export function parseQuizResponse(rawText) {
  let cleaned = rawText.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error('Quiz response must be a JSON array');
  }

  if (parsed.length !== 3) {
    throw new Error('Quiz must contain exactly 3 questions');
  }

  parsed.forEach((item, index) => {
    if (!item || typeof item.question !== 'string' || !item.question.trim()) {
      throw new Error(`Question ${index + 1} is missing a valid question string`);
    }
    if (!Array.isArray(item.options) || item.options.length !== 4) {
      throw new Error(`Question ${index + 1} must have exactly 4 options`);
    }
    if (typeof item.correct !== 'number' || item.correct < 0 || item.correct > 3) {
      throw new Error(`Question ${index + 1} must have correct index 0–3`);
    }
  });

  return parsed;
}
