const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  answers: [
    {
      questionIndex: Number,
      selectedOption: Number,
      correctOption: Number,
      isCorrect: Boolean,
      questionText: String
    }
  ],
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    default: false
  },
  timeSpentSeconds: {
    type: Number,
    default: 0
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast student and instructor analytics
quizAttemptSchema.index({ student: 1, attemptedAt: -1 });
quizAttemptSchema.index({ quiz: 1, attemptedAt: -1 });
quizAttemptSchema.index({ course: 1, attemptedAt: -1 });
quizAttemptSchema.index({ instructor: 1, attemptedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
