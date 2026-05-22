import crypto from 'crypto';

export function hashUserInput(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}
