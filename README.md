# AI Learning Assistant API

Production-style Express backend: MongoDB (Mongoose), JWT + bcrypt auth, CORS for React, and Gemini `gemini-2.5-flash` with per-mode system instructions.

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).
3. Install and run:

```bash
npm install
npm run dev
```

Requires Node.js 20+, MongoDB, and `GEMINI_API_KEY`.

## Environment

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GEMINI_MODEL` | Default: `gemini-2.5-flash` |
| `CLIENT_ORIGIN` | Comma-separated React origins (default: `http://localhost:3000,http://localhost:5173`) |

## API

### Auth

| Method | Path | Body |
|--------|------|------|
| POST | `/api/auth/register` | `{ name, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/auth/me` | — (Bearer JWT) |

### Learning

| Method | Path | Body |
|--------|------|------|
| POST | `/api/learning/generate` | `{ mode, userInput }` |

**Modes:** `explain`, `summary`, `quiz`, `revision`

### Example

```bash
curl -X POST http://localhost:5000/api/learning/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d "{\"mode\":\"quiz\",\"userInput\":\"Mitochondria are the powerhouse of the cell...\"}"
```

## Architecture

```
server.js
src/
├── config/     env, db, cors
├── models/     User (bcrypt pre-save)
├── middleware/ auth, asyncHandler, errors
├── routes/     auth, learning
├── services/   gemini (@google/genai)
└── utils/      learningModes (system instructions)
```
