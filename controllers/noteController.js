const Note = require('../models/Note');
const Course = require('../models/Course');
const fs = require('fs');
const path = require('path');
const { logInteraction } = require('../utils/logger');

// @desc Get all notes with optional course or subject filter
// @route GET /api/notes
// @access Public
exports.getAllNotes = async (req, res) => {
  try {
    const { courseId, subject, search, instructorId } = req.query;
    let query = {};

    if (courseId) {
      query.course = courseId;
    }
    if (subject && subject !== 'All') {
      query.subject = subject;
    }
    if (instructorId) {
      query.instructor = instructorId;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const notes = await Note.find(query)
      .populate('course', 'title category')
      .populate('instructor', 'name designation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving notes'
    });
  }
};

// @desc Get single note by ID
// @route GET /api/notes/:id
// @access Public
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('course', 'title category instructor')
      .populate('instructor', 'name designation');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving note'
    });
  }
};

// @desc Upload new note (Admin or Course Instructor)
// @route POST /api/notes
// @access Private (Admin or Instructor)
exports.createNote = async (req, res) => {
  try {
    const { course, title, subject, topic, description, fileUrl } = req.body;

    if (!course || !title || !subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title, subject, and topic are required'
      });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Associated course not found'
      });
    }

    // Role check: Admin or course author
    const isAuthor = (courseDoc.instructorId && courseDoc.instructorId.toString() === req.user._id.toString()) ||
                     (courseDoc.createdBy && courseDoc.createdBy.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload notes to this course'
      });
    }

    let finalFileUrl = fileUrl;
    let originalName = 'study-notes.pdf';
    let fileSize = '1.2 MB';

    if (req.file) {
      finalFileUrl = `/uploads/notes/${req.file.filename}`;
      originalName = req.file.originalname;
      const sizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
      fileSize = `${sizeMB} MB`;
    }

    if (!finalFileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file or provide a valid PDF link'
      });
    }

    const note = await Note.create({
      course,
      instructor: courseDoc.instructorId || req.user._id,
      title,
      subject,
      topic,
      description: description || '',
      fileUrl: finalFileUrl,
      originalName,
      fileSize,
      uploadedBy: req.user._id
    });

    await logInteraction({
      user: req.user,
      action: 'note_uploaded',
      category: 'course_management',
      entityId: note._id,
      entityModel: 'Note',
      details: `${req.user.name} uploaded PDF note: "${note.title}" for course "${courseDoc.title}"`
    });

    res.status(201).json({
      success: true,
      message: 'Study notes uploaded successfully',
      data: note
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error uploading note'
    });
  }
};

// @desc Delete note
// @route DELETE /api/notes/:id
// @access Private (Admin or Instructor)
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const isAuthor = note.uploadedBy && note.uploadedBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this study note'
      });
    }

    if (note.fileUrl && note.fileUrl.startsWith('/uploads/notes/')) {
      const filePath = path.join(__dirname, '..', note.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Note.findByIdAndDelete(req.params.id);

    await logInteraction({
      user: req.user,
      action: 'note_deleted',
      category: 'course_management',
      entityId: note._id,
      entityModel: 'Note',
      details: `${req.user.name} deleted study note: "${note.title}"`
    });

    res.status(200).json({
      success: true,
      message: 'Study material deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error deleting note'
    });
  }
};
