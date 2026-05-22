import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials({ name, email, password }, requireName = false) {
  const errors = [];

  if (requireName && (!name || typeof name !== 'string' || !name.trim())) {
    errors.push('name is required');
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('email is required');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('email format is invalid');
  }

  if (!password || typeof password !== 'string') {
    errors.push('password is required');
  } else if (password.length < 8) {
    errors.push('password must be at least 8 characters');
  }

  return errors;
}

function formatUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const errors = validateCredentials({ name, email, password }, true);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      user: formatUser(user),
      token,
    });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const errors = validateCredentials({ email, password });

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      user: formatUser(user),
      token,
    });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true, user: formatUser(req.user) });
  })
);

export default router;
