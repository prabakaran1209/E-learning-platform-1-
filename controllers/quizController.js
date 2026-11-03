const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Enrolment = require('../models/Enrolment');
const Course = require('../models/Course');
const { logInteraction } = require('../utils/logger');

// @desc Get all quizzes
// @route GET /api/quizzes
// @access Public (with optional auth)
exports.getAllQuizzes = async (req, res) => {
  try {
    const { courseId, search, instructorId } = req.query;
    let query = {};

    if (courseId) {
      query.course = courseId;
    }
    if (instructorId) {
      query.instructor = instructorId;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const quizzes = await Quiz.find(query)
      .populate('course', 'title category')
      .populate('instructor', 'name designation')
      .select('-questions.correctOption -questions.explanation')
      .sort({ createdAt: -1 })
      .lean();

    // Check attempts if logged in
    const quizzesWithAttempts = await Promise.all(
      quizzes.map(async (q) => {
        let attempt = null;
        if (req.user) {
          attempt = await QuizAttempt.findOne({
            student: req.user._id,
            quiz: q._id
          }).sort({ attemptedAt: -1 });
        }
        return {
          ...q,
          totalQuestions: q.questions ? q.questions.length : 0,
          latestAttempt: attempt
        };
      })
    );

    res.status(200).json({
      success: true,
      count: quizzesWithAttempts.length,
      data: quizzesWithAttempts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving quizzes'
    });
  }
};

// @desc Get single quiz for taking (student) or managing (admin/instructor)
// @route GET /api/quizzes/:id
// @access Public (with optional auth)
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course', 'title category instructor')
      .populate('instructor', 'name designation');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // If user is not admin or instructor, do not leak correctOption in question payload
    let quizData = quiz.toObject();
    const canSeeAnswers = req.user && (req.user.role === 'admin' || req.user.role === 'instructor');

    if (!canSeeAnswers) {
      quizData.questions = quizData.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options
      }));
    }

    res.status(200).json({
      success: true,
      data: quizData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving quiz'
    });
  }
};

// @desc Submit quiz answers & calculate result (Student)
// @route POST /api/quizzes/:id/submit
// @access Private (Student)
exports.submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const { answers, timeSpentSeconds = 0 } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be provided as an array'
      });
    }

    let correctCount = 0;
    const evaluatedAnswers = quiz.questions.map((q, idx) => {
      const studentAns = answers.find(a => a.questionIndex === idx);
      const selected = studentAns !== undefined ? Number(studentAns.selectedOption) : -1;
      const isCorrect = selected === q.correctOption;

      if (isCorrect) correctCount++;

      return {
        questionIndex: idx,
        questionText: q.questionText,
        options: q.options,
        selectedOption: selected,
        correctOption: q.correctOption,
        isCorrect,
        explanation: q.explanation || ''
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = percentage >= (quiz.passingPercentage || 60);

    const instructorId = quiz.instructor || (quiz.course && quiz.course.instructorId);

    const attempt = await QuizAttempt.create({
      student: req.user._id,
      quiz: quiz._id,
      course: quiz.course ? quiz.course._id : quiz.course,
      instructor: instructorId,
      answers: evaluatedAnswers,
      score: correctCount,
      totalQuestions,
      percentage,
      passed,
      timeSpentSeconds
    });

    // Track interaction in MongoDB
    await logInteraction({
      user: req.user,
      action: 'quiz_submitted',
      category: 'assessment',
      entityId: attempt._id,
      entityModel: 'QuizAttempt',
      details: `Student ${req.user.name} submitted quiz "${quiz.title}": ${correctCount}/${totalQuestions} (${percentage}%, ${passed ? 'PASSED' : 'FAILED'})`,
      metadata: {
        quizId: quiz._id,
        quizTitle: quiz.title,
        courseId: quiz.course ? quiz.course._id : null,
        score: correctCount,
        percentage,
        passed
      }
    });

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        attemptId: attempt._id,
        score: correctCount,
        totalQuestions,
        percentage,
        passed,
        passingPercentage: quiz.passingPercentage || 60,
        evaluatedAnswers
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error submitting quiz'
    });
  }
};

// @desc Get single attempt result by ID
// @route GET /api/quizzes/attempts/:id
// @access Private
exports.getAttemptById = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id)
      .populate('quiz', 'title timeLimitMinutes totalMarks')
      .populate('course', 'title category')
      .populate('student', 'name email studentId')
      .populate('instructor', 'name designation');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }

    // Student can see own; Instructor can see attempts for their courses; Admin can see all
    const isOwner = attempt.student._id.toString() === req.user._id.toString();
    const isCourseInstructor = attempt.instructor && attempt.instructor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isCourseInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this result'
      });
    }

    res.status(200).json({
      success: true,
      data: attempt
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving quiz result'
    });
  }
};

// @desc Get student's previous quiz results
// @route GET /api/quizzes/my-results
// @access Private (Student)
exports.getMyQuizResults = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user._id })
      .populate('quiz', 'title')
      .populate('course', 'title category')
      .sort({ attemptedAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving your quiz history'
    });
  }
};

// @desc Get all student quiz submissions for instructor's courses
// @route GET /api/quizzes/instructor/submissions
// @access Private (Instructor or Admin)
exports.getInstructorQuizSubmissions = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'instructor') {
      const instructorCourses = await Course.find({
        $or: [{ instructorId: req.user._id }, { createdBy: req.user._id }]
      }).select('_id');
      const courseIds = instructorCourses.map(c => c._id);
      query = { course: { $in: courseIds } };
    }

    const attempts = await QuizAttempt.find(query)
      .populate('student', 'name email studentId')
      .populate('quiz', 'title totalMarks')
      .populate('course', 'title category')
      .sort({ attemptedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving student quiz submissions'
    });
  }
};

// @desc Create Quiz (Admin or Course Instructor)
// @route POST /api/quizzes
// @access Private (Admin or Instructor)
exports.createQuiz = async (req, res) => {
  try {
    const { course, title, description, timeLimitMinutes, passingPercentage, questions } = req.body;

    if (!course || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title, and at least one question are required'
      });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Associated course not found'
      });
    }

    const isAuthor = (courseDoc.instructorId && courseDoc.instructorId.toString() === req.user._id.toString()) ||
                     (courseDoc.createdBy && courseDoc.createdBy.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create quizzes for this course'
      });
    }

    // Validate each question has 4 options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !Array.isArray(q.options) || q.options.length !== 4 || q.correctOption === undefined) {
        return res.status(400).json({
          success: false,
          message: `Question #${i + 1} must include text, exactly 4 options, and a valid correct option index (0-3).`
        });
      }
    }

    const quiz = await Quiz.create({
      course,
      instructor: courseDoc.instructorId || req.user._id,
      createdBy: req.user._id,
      title,
      description: description || '',
      timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : 15,
      passingPercentage: passingPercentage ? Number(passingPercentage) : 60,
      questions
    });

    await logInteraction({
      user: req.user,
      action: 'quiz_created',
      category: 'course_management',
      entityId: quiz._id,
      entityModel: 'Quiz',
      details: `${req.user.name} created quiz "${quiz.title}" for course "${courseDoc.title}"`
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error creating quiz'
    });
  }
};

// @desc Update Quiz
// @route PUT /api/quizzes/:id
// @access Private (Admin or Instructor)
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const isAuthor = quiz.createdBy && quiz.createdBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this quiz'
      });
    }

    const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error updating quiz'
    });
  }
};

// @desc Delete Quiz
// @route DELETE /api/quizzes/:id
// @access Private (Admin or Instructor)
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const isAuthor = quiz.createdBy && quiz.createdBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this quiz'
      });
    }

    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await Quiz.findByIdAndDelete(req.params.id);

    await logInteraction({
      user: req.user,
      action: 'quiz_created', // deleted action
      category: 'course_management',
      entityId: quiz._id,
      entityModel: 'Quiz',
      details: `${req.user.name} deleted quiz "${quiz.title}"`
    });

    res.status(200).json({
      success: true,
      message: 'Quiz and all associated results deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error deleting quiz'
    });
  }
};
