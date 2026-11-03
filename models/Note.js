const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: [true, 'Please provide note title'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please provide subject name'],
    trim: true
  },
  topic: {
    type: String,
    required: [true, 'Please provide topic name'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    required: [true, 'PDF file URL/path is required']
  },
  originalName: {
    type: String,
    default: 'study-note.pdf'
  },
  fileSize: {
    type: String,
    default: '1.2 MB'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

noteSchema.index({ course: 1, createdAt: -1 });
noteSchema.index({ instructor: 1 });

module.exports = mongoose.model('Note', noteSchema);
