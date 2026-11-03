const Video = require('../models/Video');
const Course = require('../models/Course');
const Enrolment = require('../models/Enrolment');
const { logInteraction } = require('../utils/logger');

// Helper to extract YouTube ID
const extractYouTubeId = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
};

// @desc Get all videos with optional course or topic filter
// @route GET /api/videos
// @access Public (with optional auth for completion status)
exports.getAllVideos = async (req, res) => {
  try {
    const { courseId, search, topic } = req.query;
    let query = {};

    if (courseId) {
      query.course = courseId;
    }
    if (topic && topic !== 'All') {
      query.topic = topic;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const videos = await Video.find(query)
      .populate('course', 'title category')
      .populate('instructor', 'name designation')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    let completedIds = [];
    if (req.user && courseId) {
      const enrolment = await Enrolment.findOne({
        student: req.user._id,
        course: courseId
      });
      if (enrolment) {
        completedIds = enrolment.completedVideos.map(id => id.toString());
      }
    } else if (req.user) {
      const enrolments = await Enrolment.find({ student: req.user._id });
      enrolments.forEach(e => {
        e.completedVideos.forEach(vId => completedIds.push(vId.toString()));
      });
    }

    const videosWithStatus = videos.map(v => ({
      ...v,
      isCompleted: completedIds.includes(v._id.toString())
    }));

    res.status(200).json({
      success: true,
      count: videosWithStatus.length,
      data: videosWithStatus
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving videos'
    });
  }
};

// @desc Get single video
// @route GET /api/videos/:id
// @access Public
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('course', 'title category instructor')
      .populate('instructor', 'name designation');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video lesson not found'
      });
    }

    let isCompleted = false;
    if (req.user) {
      const enrolment = await Enrolment.findOne({
        student: req.user._id,
        course: video.course._id
      });
      if (enrolment && enrolment.completedVideos.includes(video._id)) {
        isCompleted = true;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...video.toObject(),
        isCompleted
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving video'
    });
  }
};

// @desc Create video lesson (Admin or Course Instructor)
// @route POST /api/videos
// @access Private (Admin or Instructor)
exports.createVideo = async (req, res) => {
  try {
    const { course, title, topic, youtubeUrl, duration, order, description } = req.body;

    if (!course || !title || !topic || !youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title, topic, and YouTube URL are required'
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
        message: 'You are not authorized to add video lessons to this course'
      });
    }

    const youtubeId = extractYouTubeId(youtubeUrl);

    const video = await Video.create({
      course,
      instructor: courseDoc.instructorId || req.user._id,
      uploadedBy: req.user._id,
      title,
      topic,
      youtubeUrl,
      youtubeId,
      duration: duration || '15 mins',
      order: order ? Number(order) : 1,
      description: description || ''
    });

    // Update totalLessons in course
    const totalVideos = await Video.countDocuments({ course });
    await Course.findByIdAndUpdate(course, { totalLessons: totalVideos });

    await logInteraction({
      user: req.user,
      action: 'video_added',
      category: 'course_management',
      entityId: video._id,
      entityModel: 'Video',
      details: `${req.user.name} added video lesson: "${video.title}" to course: "${courseDoc.title}"`
    });

    res.status(201).json({
      success: true,
      message: 'Video lesson added successfully',
      data: video
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error adding video'
    });
  }
};

// @desc Update video
// @route PUT /api/videos/:id
// @access Private (Admin or Instructor)
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('course');
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video lesson not found'
      });
    }

    const isAuthor = video.uploadedBy && video.uploadedBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this video'
      });
    }

    const updates = { ...req.body };
    if (updates.youtubeUrl) {
      updates.youtubeId = extractYouTubeId(updates.youtubeUrl);
    }

    const updatedVideo = await Video.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: updatedVideo
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error updating video'
    });
  }
};

// @desc Delete video
// @route DELETE /api/videos/:id
// @access Private (Admin or Instructor)
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video lesson not found'
      });
    }

    const courseId = video.course;
    await Video.findByIdAndDelete(req.params.id);

    // Update course total lessons count
    const totalVideos = await Video.countDocuments({ course: courseId });
    await Course.findByIdAndUpdate(courseId, { totalLessons: totalVideos });

    await logInteraction({
      user: req.user,
      action: 'video_deleted',
      category: 'course_management',
      entityId: video._id,
      entityModel: 'Video',
      details: `${req.user.name} removed video lesson "${video.title}"`
    });

    res.status(200).json({
      success: true,
      message: 'Video lesson deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error deleting video'
    });
  }
};

// @desc Mark lesson / video as completed (Student)
// @route POST /api/videos/:id/complete
// @access Private (Student)
exports.markLessonCompleted = async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId).populate('course');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video lesson not found'
      });
    }

    let enrolment = await Enrolment.findOne({
      student: req.user._id,
      course: video.course._id
    });

    if (!enrolment) {
      enrolment = await Enrolment.create({
        student: req.user._id,
        course: video.course._id,
        instructor: video.course.instructorId || video.course.createdBy,
        completedVideos: [videoId]
      });
    } else {
      if (!enrolment.completedVideos.includes(videoId)) {
        enrolment.completedVideos.push(videoId);
      }
    }

    // Calculate course completion percentage
    const totalVideos = await Video.countDocuments({ course: video.course._id });
    const completedCount = enrolment.completedVideos.length;
    
    let progressPercentage = 0;
    if (totalVideos > 0) {
      progressPercentage = Math.min(100, Math.round((completedCount / totalVideos) * 100));
    } else {
      progressPercentage = 100;
    }

    enrolment.progressPercentage = progressPercentage;
    if (progressPercentage === 100) {
      enrolment.status = 'completed';
      enrolment.completedAt = new Date();
      enrolment.grade = 'Completed';
    }
    enrolment.lastAccessed = new Date();
    await enrolment.save();

    // Track interaction
    await logInteraction({
      user: req.user,
      action: 'lesson_completed',
      category: 'learning',
      entityId: video._id,
      entityModel: 'Video',
      details: `Student ${req.user.name} completed video lesson: "${video.title}" in course: "${video.course.title}" (${progressPercentage}% overall)`,
      metadata: { videoId, courseId: video.course._id, progressPercentage }
    });

    res.status(200).json({
      success: true,
      message: 'Lesson marked as completed!',
      completedCount,
      totalVideos,
      progressPercentage,
      status: enrolment.status
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error marking lesson completed'
    });
  }
};
