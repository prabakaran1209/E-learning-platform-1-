const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: [true, 'Please provide video lesson title'],
    trim: true
  },
  topic: {
    type: String,
    required: [true, 'Please provide lesson topic'],
    trim: true
  },
  youtubeUrl: {
    type: String,
    required: [true, 'Please provide YouTube URL']
  },
  youtubeId: {
    type: String,
    required: [true, 'YouTube video ID is required']
  },
  duration: {
    type: String,
    default: '15 mins'
  },
  order: {
    type: Number,
    default: 1
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

videoSchema.index({ course: 1, order: 1 });
videoSchema.index({ instructor: 1 });

module.exports = mongoose.model('Video', videoSchema);
