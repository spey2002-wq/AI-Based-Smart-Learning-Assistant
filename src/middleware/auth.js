import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const jwtSecret = () => process.env.JWT_SECRET;
const jwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const secret = jwtSecret();
    if (!secret) {
      return res.status(503).json({ message: 'JWT_SECRET is not configured on the server' });
    }
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function signToken(userId) {
  const secret = jwtSecret();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ sub: userId }, secret, {
    expiresIn: jwtExpiresIn(),
  });
}
