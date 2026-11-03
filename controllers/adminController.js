const User = require('../models/User');
const Course = require('../models/Course');
const Enrolment = require('../models/Enrolment');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Note = require('../models/Note');
const Video = require('../models/Video');
const Interaction = require('../models/Interaction');
const { logInteraction } = require('../utils/logger');

// @desc Get comprehensive admin metrics & platform analytics
// @route GET /api/admin/stats
// @access Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      totalEnrolments,
      totalQuizzes,
      totalNotes,
      totalVideos,
      totalQuizAttempts,
      totalInteractions
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Enrolment.countDocuments(),
      Quiz.countDocuments(),
      Note.countDocuments(),
      Video.countDocuments(),
      QuizAttempt.countDocuments(),
      Interaction.countDocuments()
    ]);

    // Calculate Platform-Wide Average Quiz Score
    const quizAttempts = await QuizAttempt.find().select('percentage').lean();
    let platformAverageQuiz = 0;
    if (quizAttempts.length > 0) {
      const sum = quizAttempts.reduce((acc, q) => acc + (q.percentage || 0), 0);
      platformAverageQuiz = Math.round(sum / quizAttempts.length);
    }

    // Recent Enrolments with student and course details
    const recentEnrolments = await Enrolment.find()
      .populate('student', 'name email studentId avatar')
      .populate('course', 'title category')
      .populate('instructor', 'name')
      .sort({ enrolledAt: -1 })
      .limit(6);

    // Recent Quiz Submissions
    const recentQuizAttempts = await QuizAttempt.find()
      .populate('student', 'name email studentId')
      .populate('quiz', 'title')
      .populate('course', 'title')
      .sort({ attemptedAt: -1 })
      .limit(6);

    // Recent System Interactions (Audit Trail)
    const recentInteractions = await Interaction.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: totalStudents + totalInstructors + totalAdmins,
          totalStudents,
          totalInstructors,
          totalAdmins,
          totalCourses,
          totalEnrolments,
          totalQuizzes,
          totalNotes,
          totalVideos,
          totalQuizAttempts,
          totalInteractions,
          platformAverageQuiz
        },
        recentEnrolments,
        recentQuizAttempts,
        recentInteractions
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error loading admin metrics'
    });
  }
};

// @desc Get all registered students with learning statistics
// @route GET /api/admin/students
// @access Private (Admin only)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 }).lean();

    const studentsWithMetrics = await Promise.all(
      students.map(async (student) => {
        const enrolments = await Enrolment.find({ student: student._id });
        const completedCourses = enrolments.filter(e => e.progressPercentage === 100 || e.status === 'completed').length;
        const quizAttempts = await QuizAttempt.find({ student: student._id });
        
        let avgQuiz = 0;
        if (quizAttempts.length > 0) {
          const totalPerc = quizAttempts.reduce((acc, q) => acc + (q.percentage || 0), 0);
          avgQuiz = Math.round(totalPerc / quizAttempts.length);
        }

        return {
          ...student,
          totalEnrolments: enrolments.length,
          completedCourses,
          quizAttemptsCount: quizAttempts.length,
          avgQuizScore: avgQuiz
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentsWithMetrics.length,
      data: studentsWithMetrics
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving students list'
    });
  }
};

// @desc Get all registered instructors with curriculum statistics
// @route GET /api/admin/instructors
// @access Private (Admin only)
exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' }).select('-password').sort({ createdAt: -1 }).lean();

    const instructorsWithMetrics = await Promise.all(
      instructors.map(async (inst) => {
        const courses = await Course.find({
          $or: [{ instructorId: inst._id }, { createdBy: inst._id }]
        });
        const courseIds = courses.map(c => c._id);
        const totalEnrolments = await Enrolment.countDocuments({ course: { $in: courseIds } });
        const totalQuizzes = await Quiz.countDocuments({ course: { $in: courseIds } });

        return {
          ...inst,
          coursesCount: courses.length,
          totalEnrolments,
          totalQuizzes
        };
      })
    );

    res.status(200).json({
      success: true,
      count: instructorsWithMetrics.length,
      data: instructorsWithMetrics
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving instructors list'
    });
  }
};

// @desc Get system interaction audit trail
// @route GET /api/admin/interactions
// @access Private (Admin only)
exports.getInteractions = async (req, res) => {
  try {
    const { action, category, userRole, limit = 50 } = req.query;
    let query = {};

    if (action) query.action = action;
    if (category) query.category = category;
    if (userRole) query.userRole = userRole;

    const logs = await Interaction.find(query)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving interaction logs'
    });
  }
};

// @desc Delete student or instructor account
// @route DELETE /api/admin/users/:id
// @access Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userToDelete.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an administrator account'
      });
    }

    if (userToDelete.role === 'student') {
      await Enrolment.deleteMany({ student: userToDelete._id });
      await QuizAttempt.deleteMany({ student: userToDelete._id });
    }

    await User.findByIdAndDelete(req.params.id);

    await logInteraction({
      user: req.user,
      action: 'student_deleted',
      category: 'admin',
      details: `Admin ${req.user.name} removed ${userToDelete.role} account "${userToDelete.name}" (${userToDelete.email})`
    });

    res.status(200).json({
      success: true,
      message: `${userToDelete.role.charAt(0).toUpperCase() + userToDelete.role.slice(1)} account deleted successfully`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error deleting user'
    });
  }
};
