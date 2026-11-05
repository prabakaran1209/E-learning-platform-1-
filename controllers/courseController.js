const Course = require('../models/Course');
const Video = require('../models/Video');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const Enrolment = require('../models/Enrolment');
const { logInteraction } = require('../utils/logger');

// @desc Get all courses with search and filtering
// @route GET /api/courses
// @access Public (with optional auth for enrollment status)
exports.getAllCourses = async (req, res) => {
  try {
    const { search, category, level, instructorId } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (level && level !== 'All') {
      query.level = level;
    }

    if (instructorId) {
      query.instructorId = instructorId;
    }

    const courses = await Course.find(query)
      .populate('instructorId', 'name designation department qualification avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Attach counts and student enrollment status if logged in
    const coursesWithMeta = await Promise.all(
      courses.map(async (course) => {
        const videoCount = await Video.countDocuments({ course: course._id });
        const noteCount = await Note.countDocuments({ course: course._id });
        const quizCount = await Quiz.countDocuments({ course: course._id });
        const enrolledCount = await Enrolment.countDocuments({ course: course._id });

        let isEnrolled = false;
        let progress = 0;

        if (req.user) {
          const enrolment = await Enrolment.findOne({
            student: req.user._id,
            course: course._id
          });
          if (enrolment) {
            isEnrolled = true;
            progress = enrolment.progressPercentage;
          }
        }

        return {
          ...course,
          videoCount,
          noteCount,
          quizCount,
          enrolledCount,
          isEnrolled,
          progress
        };
      })
    );

    res.status(200).json({
      success: true,
      count: coursesWithMeta.length,
      data: coursesWithMeta
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving courses'
    });
  }
};

// @desc Get single course by ID or Course Code (e.g. CCS370)
// @route GET /api/courses/:id
// @access Public (with optional auth)
exports.getCourseById = async (req, res) => {
  try {
    const param = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(param);
    const query = isObjectId ? { _id: param } : { courseCode: param.toUpperCase() };

    const course = await Course.findOne(query)
      .populate('instructorId', 'name designation department qualification bio avatar')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const videos = await Video.find({ course: course._id }).sort({ order: 1 });
    const notes = await Note.find({ course: course._id }).sort({ createdAt: -1 });
    const quizzes = await Quiz.find({ course: course._id }).select('-questions.correctOption -questions.explanation');
    const enrolledCount = await Enrolment.countDocuments({ course: course._id });

    let isEnrolled = false;
    let enrolment = null;

    if (req.user) {
      enrolment = await Enrolment.findOne({
        student: req.user._id,
        course: course._id
      });
      if (enrolment) {
        isEnrolled = true;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...course,
        videos,
        notes,
        quizzes,
        enrolledCount,
        isEnrolled,
        enrolment
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving course details'
    });
  }
};

// @desc Get courses authored by the current instructor
// @route GET /api/courses/instructor/my-courses
// @access Private (Instructor only)
exports.getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      $or: [{ instructorId: req.user._id }, { createdBy: req.user._id }]
    }).sort({ createdAt: -1 }).lean();

    const coursesWithAnalytics = await Promise.all(
      courses.map(async (course) => {
        const enrolments = await Enrolment.find({ course: course._id });
        const videoCount = await Video.countDocuments({ course: course._id });
        const noteCount = await Note.countDocuments({ course: course._id });
        const quizCount = await Quiz.countDocuments({ course: course._id });

        const completedEnrolments = enrolments.filter(e => e.progressPercentage === 100 || e.status === 'completed').length;
        const avgProgress = enrolments.length > 0
          ? Math.round(enrolments.reduce((acc, curr) => acc + (curr.progressPercentage || 0), 0) / enrolments.length)
          : 0;

        return {
          ...course,
          totalStudents: enrolments.length,
          completedStudents: completedEnrolments,
          averageProgress: avgProgress,
          videoCount,
          noteCount,
          quizCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: coursesWithAnalytics.length,
      data: coursesWithAnalytics
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving instructor courses'
    });
  }
};

// @desc Create course (Admin or Instructor)
// @route POST /api/courses
// @access Private (Admin or Instructor)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, instructor, category, duration, level, thumbnail, courseCode } = req.body;

    let thumbUrl = thumbnail;
    if (req.file) {
      thumbUrl = `/uploads/thumbnails/${req.file.filename}`;
    }

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Validate course code if provided (e.g. CCS370 or CS1001)
    let formattedCode = courseCode ? courseCode.trim().toUpperCase() : undefined;
    if (formattedCode && !/^[A-Z]{3,4}\d{3,4}$/.test(formattedCode)) {
      return res.status(400).json({
        success: false,
        message: 'Course ID/Code must be in format like CCS370 or CS1001 (3-4 letters followed by 3-4 numbers)'
      });
    }

    const instructorName = req.user.role === 'instructor' ? req.user.name : (instructor || req.user.name);
    const instructorId = req.user.role === 'instructor' ? req.user._id : (req.body.instructorId || req.user._id);

    const course = await Course.create({
      courseCode: formattedCode,
      title,
      description,
      instructor: instructorName,
      instructorId,
      createdBy: req.user._id,
      category: category || 'Web Development',
      duration: duration || '6 Weeks',
      level: level || 'Beginner',
      thumbnail: thumbUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'
    });

    // Track interaction
    await logInteraction({
      user: req.user,
      action: 'course_created',
      category: 'course_management',
      entityId: course._id,
      entityModel: 'Course',
      details: `${req.user.role} ${req.user.name} created course: "${course.title}"`,
      metadata: { courseTitle: course.title, category: course.category }
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error creating course'
    });
  }
};

// @desc Update course
// @route PUT /api/courses/:id
// @access Private (Admin or Course Author Instructor)
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Role-based authorization check: Admin or course author
    const isAuthor = (course.instructorId && course.instructorId.toString() === req.user._id.toString()) ||
      (course.createdBy && course.createdBy.toString() === req.user._id.toString());

    if (req.user.role !== 'admin' && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this course'
      });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }

    course = await Course.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    await logInteraction({
      user: req.user,
      action: 'course_updated',
      category: 'course_management',
      entityId: course._id,
      entityModel: 'Course',
      details: `${req.user.name} updated course: "${course.title}"`
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error updating course'
    });
  }
};

// @desc Delete course
// @route DELETE /api/courses/:id
// @access Private (Admin or Course Author Instructor)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const isAuthor = (course.instructorId && course.instructorId.toString() === req.user._id.toString()) ||
      (course.createdBy && course.createdBy.toString() === req.user._id.toString());

    if (req.user.role !== 'admin' && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this course'
      });
    }

    // Cascade delete related records
    await Video.deleteMany({ course: course._id });
    await Note.deleteMany({ course: course._id });
    await Quiz.deleteMany({ course: course._id });
    await Enrolment.deleteMany({ course: course._id });

    await Course.findByIdAndDelete(req.params.id);

    await logInteraction({
      user: req.user,
      action: 'course_deleted',
      category: 'course_management',
      entityId: course._id,
      entityModel: 'Course',
      details: `${req.user.name} deleted course: "${course.title}" and related records`
    });

    res.status(200).json({
      success: true,
      message: 'Course and all related learning materials deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error deleting course'
    });
  }
};
