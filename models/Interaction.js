const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_registered',
      'user_login',
      'course_created',
      'course_updated',
      'course_deleted',
      'course_enrolled',
      'lesson_completed',
      'quiz_created',
      'quiz_submitted',
      'note_uploaded',
      'note_deleted',
      'video_added',
      'video_deleted',
      'profile_updated',
      'student_deleted'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: ['authentication', 'enrollment', 'learning', 'course_management', 'assessment', 'admin']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  entityModel: {
    type: String,
    enum: ['Course', 'Quiz', 'QuizAttempt', 'Video', 'Note', 'Enrolment', 'User', null],
    default: null
  },
  details: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast analytics querying
interactionSchema.index({ user: 1, timestamp: -1 });
interactionSchema.index({ action: 1, timestamp: -1 });
interactionSchema.index({ category: 1, timestamp: -1 });
interactionSchema.index({ entityId: 1 });

module.exports = mongoose.model('Interaction', interactionSchema);

