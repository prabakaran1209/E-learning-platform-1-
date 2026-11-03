const Enrolment = require('../models/Enrolment');
const Course = require('../models/Course');
const Video = require('../models/Video');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { logInteraction } = require('../utils/logger');

// @desc Enroll in a course (Student)
// @route POST /api/enrolments
// @access Private (Student)
exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required for enrolment'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check duplicate enrolment
    const existingEnrolment = await Enrolment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingEnrolment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course',
        data: existingEnrolment
      });
    }

    const instructorId = course.instructorId || course.createdBy;

    const enrolment = await Enrolment.create({
      student: req.user._id,
      course: courseId,
      instructor: instructorId,
      enrolledAt: new Date(),
      status: 'active',
      progressPercentage: 0,
      completedVideos: []
    });

    // Increment enrolledCount in course
    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

    // Track interaction
    await logInteraction({
      user: req.user,
      action: 'course_enrolled',
      category: 'enrollment',
      entityId: course._id,
      entityModel: 'Course',
      details: `Student ${req.user.name} enrolled in "${course.title}"`,
      metadata: { courseId: course._id, courseTitle: course.title, instructorId }
    });

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully!',
      data: enrolment
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during enrolment'
    });
  }
};

// @desc Get student's enrolled courses
// @route GET /api/enrolments/my-courses
// @access Private (Student)
exports.getMyEnrolments = async (req, res) => {
  try {
    const enrolments = await Enrolment.find({ student: req.user._id })
      .populate('course')
      .populate('instructor', 'name designation email avatar')
      .sort({ enrolledAt: -1 })
      .lean();

    const enriched = await Promise.all(
      enrolments.map(async (e) => {
        if (!e.course) return null;
        const totalVideos = await Video.countDocuments({ course: e.course._id });
        const totalNotes = await Note.countDocuments({ course: e.course._id });
        const totalQuizzes = await Quiz.countDocuments({ course: e.course._id });
        return {
          ...e,
          totalVideos,
          totalNotes,
          totalQuizzes,
          completedVideosCount: e.completedVideos ? e.completedVideos.length : 0
        };
      })
    );

    const validEnrolments = enriched.filter(e => e !== null);

    res.status(200).json({
      success: true,
      count: validEnrolments.length,
      data: validEnrolments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving enrolled courses'
    });
  }
};

// @desc Get comprehensive student learning progress
// @route GET /api/enrolments/progress
// @access Private (Student)
exports.getMyProgress = async (req, res) => {
  try {
    const enrolments = await Enrolment.find({ student: req.user._id })
      .populate('course')
      .populate('instructor', 'name designation')
      .sort({ lastAccessed: -1 })
      .lean();

    const totalEnrolled = enrolments.length;
    let completedCourses = 0;
    let pendingCourses = 0;
    let totalLessonsCompleted = 0;

    const courseBreakdown = await Promise.all(
      enrolments.map(async (e) => {
        if (!e.course) return null;
        const totalVideos = await Video.countDocuments({ course: e.course._id });
        const completedVideos = e.completedVideos ? e.completedVideos.length : 0;
        totalLessonsCompleted += completedVideos;

        let calculatedProgress = totalVideos > 0
          ? Math.min(100, Math.round((completedVideos / totalVideos) * 100))
          : (e.progressPercentage || 0);

        const isCompleted = calculatedProgress === 100 || e.status === 'completed';
        if (isCompleted) {
          completedCourses++;
        } else {
          pendingCourses++;
        }

        return {
          enrolmentId: e._id,
          courseId: e.course._id,
          courseTitle: e.course.title,
          category: e.course.category,
          instructor: e.instructor ? e.instructor.name : e.course.instructor,
          thumbnail: e.course.thumbnail,
          enrolledAt: e.enrolledAt,
          lastAccessed: e.lastAccessed,
          progressPercentage: calculatedProgress,
          status: isCompleted ? 'completed' : 'active',
          totalLessons: totalVideos,
          completedLessons: completedVideos
        };
      })
    );

    const validCourses = courseBreakdown.filter(c => c !== null);

    // Calculate Average Quiz Score
    const quizAttempts = await QuizAttempt.find({ student: req.user._id }).lean();
    let averageQuizScore = 0;
    if (quizAttempts.length > 0) {
      const sumPercentage = quizAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      averageQuizScore = Math.round(sumPercentage / quizAttempts.length);
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEnrolled,
          completedCourses,
          pendingCourses,
          totalLessonsCompleted,
          averageQuizScore,
          totalQuizAttempts: quizAttempts.length
        },
        courses: validCourses,
        recentQuizAttempts: quizAttempts.slice(0, 5)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving progress metrics'
    });
  }
};

// @desc Get enrolments for instructor's courses
// @route GET /api/enrolments/instructor-students
// @access Private (Instructor or Admin)
exports.getInstructorEnrolments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'instructor') {
      // Find courses authored by instructor
      const instructorCourses = await Course.find({
        $or: [{ instructorId: req.user._id }, { createdBy: req.user._id }]
      }).select('_id');
      const courseIds = instructorCourses.map(c => c._id);
      query = { course: { $in: courseIds } };
    }

    const enrolments = await Enrolment.find(query)
      .populate('student', 'name email studentId major avatar')
      .populate('course', 'title category')
      .sort({ enrolledAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: enrolments.length,
      data: enrolments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving instructor student enrolments'
    });
  }
};
