import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next();
  }

  try {
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select('-password');
    if (user) {
      req.user = user;
    }
  } catch {
    // Invalid token — treat as guest
  }

  next();
}
