const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Za-z]{3,4}\d{3,4}$/, 'Course code must follow format like CCS370 or CS101 (3-4 letters followed by 3-4 numbers)'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide course title'],
    trim: true,
    maxlength: 120
  },
  description: {
    type: String,
    required: [true, 'Please provide course description']
  },
  instructor: {
    type: String,
    required: [true, 'Please provide instructor name'],
    trim: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    enum: [
      'Web Development',
      'Data Science',
      'AI & Machine Learning',
      'Mobile Development',
      'Cyber Security',
      'Cloud Computing',
      'Database Systems',
      'Programming Languages'
    ],
    default: 'Web Development'
  },
  duration: {
    type: String,
    required: [true, 'Please provide course duration (e.g. 6 Weeks)'],
    default: '6 Weeks'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  thumbnail: {
    type: String,
    default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'
  },
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'published'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  enrolledCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 4.8 },
    count: { type: Number, default: 12 }
  },
  tags: {
    type: [String],
    default: []
  },
  prerequisites: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for searching & instructor querying
courseSchema.index({ title: 'text', description: 'text', instructor: 'text' });
courseSchema.index({ instructorId: 1, createdAt: -1 });
courseSchema.index({ category: 1, level: 1 });

module.exports = mongoose.model('Course', courseSchema);
