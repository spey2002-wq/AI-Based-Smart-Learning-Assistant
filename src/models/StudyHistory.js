import mongoose from 'mongoose';

const studyHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mode: {
      type: String,
      required: true,
      enum: ['explain', 'summary', 'quiz', 'revision'],
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
      default: 'markdown',
    },
    cached: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

studyHistorySchema.index({ user: 1, createdAt: -1 });

export const StudyHistory = mongoose.model('StudyHistory', studyHistorySchema);
