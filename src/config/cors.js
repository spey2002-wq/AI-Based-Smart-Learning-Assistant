import cors from 'cors';
import { env } from './env.js';

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow non-browser clients (curl, Postman) with no Origin header
    if (!origin || env.clientOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400,
});
