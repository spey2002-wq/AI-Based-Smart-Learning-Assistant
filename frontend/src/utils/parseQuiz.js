/**
 * Normalize quiz items from API (supports correctIndex or correct).
 */
export function normalizeQuizItem(item) {
  const correctIndex =
    typeof item.correctIndex === 'number' ? item.correctIndex : item.correct;

  return {
    question: String(item.question || '').trim(),
    options: Array.isArray(item.options) ? item.options.map(String) : [],
    correctIndex,
  };
}

export function parseQuizFromContent(rawText) {
  let cleaned = rawText.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error('Quiz must be a JSON array');
  }

  return parsed.map(normalizeQuizItem).filter(validateQuizItem);
}

export function validateQuizItem(item) {
  return (
    item.question &&
    item.options.length === 4 &&
    typeof item.correctIndex === 'number' &&
    item.correctIndex >= 0 &&
    item.correctIndex <= 3
  );
}

/**
 * Parse raw AI text with JSON.parse into a validated quiz array.
 */
export function parseQuizRawText(rawText) {
  let cleaned = rawText.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error('Quiz output must be a JSON array');
  }

  return parsed.map(normalizeQuizItem).filter(validateQuizItem);
}

/**
 * Build quiz array from API response (parsed quiz field or raw content via JSON.parse).
 */
export function extractQuizFromResponse(data) {
  if (Array.isArray(data?.quiz) && data.quiz.length > 0) {
    return data.quiz.map(normalizeQuizItem).filter(validateQuizItem);
  }

  if (typeof data?.content === 'string' && data.content.trim()) {
    return parseQuizRawText(data.content);
  }

  return [];
}
