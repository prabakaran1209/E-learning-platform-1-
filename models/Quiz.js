const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Please provide question text'],
    trim: true
  },
  options: {
    type: [String],
    validate: [arr => arr.length === 4, 'Quiz question must have exactly 4 options']
  },
  correctOption: {
    type: Number,
    required: [true, 'Please specify the correct option index (0 to 3)'],
    min: 0,
    max: 3
  },
  explanation: {
    type: String,
    default: ''
  }
});

const quizSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: [true, 'Please provide quiz title'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  timeLimitMinutes: {
    type: Number,
    default: 15
  },
  totalMarks: {
    type: Number,
    default: 100
  },
  passingPercentage: {
    type: Number,
    default: 60
  },
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

quizSchema.index({ course: 1 });
quizSchema.index({ instructor: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
