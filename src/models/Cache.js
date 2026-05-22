import mongoose from 'mongoose';

const cacheSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      required: true,
      enum: ['explain', 'summary', 'quiz', 'revision'],
    },
    userInputHash: {
      type: String,
      required: true,
      index: true,
    },
    userInput: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    format: {
      type: String,
      enum: ['markdown', 'json'],
      default: 'markdown',
    },
    model: {
      type: String,
      default: 'gemini-2.5-flash',
    },
  },
  { timestamps: true }
);

cacheSchema.index({ mode: 1, userInputHash: 1 }, { unique: true });

export const Cache = mongoose.model('Cache', cacheSchema);
