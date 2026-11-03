const Course = require('../models/Course');
const Enrolment = require('../models/Enrolment');
const Video = require('../models/Video');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

// @desc Get instructor dashboard metrics
// @route GET /api/instructor/dashboard
// @access Private (Instructor only)
exports.getInstructorDashboard = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // Find all courses authored or assigned to this instructor
    const courses = await Course.find({
      $or: [{ instructorId }, { createdBy: instructorId }]
    }).sort({ createdAt: -1 }).lean();

    const courseIds = courses.map(c => c._id);

    // Enrollments in instructor's courses
    const enrolments = await Enrolment.find({ course: { $in: courseIds } })
      .populate('student', 'name email studentId avatar')
      .populate('course', 'title category')
      .sort({ enrolledAt: -1 })
      .lean();

    const totalStudentsEnrolled = enrolments.length;
    const completedStudentsCount = enrolments.filter(e => e.progressPercentage === 100 || e.status === 'completed').length;

    // Lesson materials counts
    const totalLessonsUploaded = await Video.countDocuments({ course: { $in: courseIds } });
    const totalNotesUploaded = await Note.countDocuments({ course: { $in: courseIds } });
    const totalQuizzesCreated = await Quiz.countDocuments({ course: { $in: courseIds } });

    // Quiz submissions for instructor's courses
    const quizAttempts = await QuizAttempt.find({ course: { $in: courseIds } })
      .populate('student', 'name email studentId')
      .populate('quiz', 'title')
      .populate('course', 'title')
      .sort({ attemptedAt: -1 })
      .lean();

    let averageStudentQuizScore = 0;
    if (quizAttempts.length > 0) {
      const sumPerc = quizAttempts.reduce((acc, q) => acc + (q.percentage || 0), 0);
      averageStudentQuizScore = Math.round(sumPerc / quizAttempts.length);
    }

    // Detailed per-course metrics
    const courseBreakdown = courses.map(c => {
      const courseEnrolments = enrolments.filter(e => e.course && e.course._id.toString() === c._id.toString());
      const courseCompleted = courseEnrolments.filter(e => e.progressPercentage === 100 || e.status === 'completed').length;
      const avgProg = courseEnrolments.length > 0
        ? Math.round(courseEnrolments.reduce((acc, e) => acc + (e.progressPercentage || 0), 0) / courseEnrolments.length)
        : 0;

      return {
        courseId: c._id,
        title: c.title,
        category: c.category,
        level: c.level,
        isAvailable: c.isAvailable,
        totalEnrolled: courseEnrolments.length,
        completedCount: courseCompleted,
        averageProgress: avgProg,
        thumbnail: c.thumbnail
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalCourses: courses.length,
          totalStudentsEnrolled,
          completedStudentsCount,
          totalLessonsUploaded,
          totalNotesUploaded,
          totalQuizzesCreated,
          totalQuizAttempts: quizAttempts.length,
          averageStudentQuizScore
        },
        courseBreakdown,
        recentEnrolments: enrolments.slice(0, 6),
        recentQuizAttempts: quizAttempts.slice(0, 6)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error loading instructor dashboard metrics'
    });
  }
};

// @desc Get student directory for instructor
// @route GET /api/instructor/students
// @access Private (Instructor only)
exports.getInstructorStudents = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({
      $or: [{ instructorId }, { createdBy: instructorId }]
    }).select('_id');

    const courseIds = courses.map(c => c._id);

    const enrolments = await Enrolment.find({ course: { $in: courseIds } })
      .populate('student', 'name email studentId major avatar phone')
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
      message: err.message || 'Server error loading instructor student directory'
    });
  }
};

