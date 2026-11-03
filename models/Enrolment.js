const mongoose = require('mongoose');

const enrolmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  },
  completedVideos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    }
  ],
  completedNotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note'
    }
  ],
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    default: 'In Progress'
  },
  timeSpentMinutes: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index to prevent duplicate enrolments
enrolmentSchema.index({ student: 1, course: 1 }, { unique: true });
// Index for instructor fast analytics
enrolmentSchema.index({ instructor: 1, status: 1 });
enrolmentSchema.index({ course: 1, status: 1 });

module.exports = mongoose.model('Enrolment', enrolmentSchema);
