const express = require('express');
const router = express.Router();
const {
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getAttemptById,
  getMyQuizResults,
  getInstructorQuizSubmissions,
  createQuiz,
  updateQuiz,
  deleteQuiz
} = require('../controllers/quizController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getAllQuizzes);
router.get('/my-results', protect, getMyQuizResults);
router.get('/instructor/submissions', protect, authorize('instructor', 'admin'), getInstructorQuizSubmissions);
router.get('/attempts/:id', protect, getAttemptById);
router.get('/:id', optionalAuth, getQuizById);

router.post('/:id/submit', protect, submitQuiz);
router.post('/', protect, authorize('admin', 'instructor'), createQuiz);
router.put('/:id', protect, authorize('admin', 'instructor'), updateQuiz);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteQuiz);

module.exports = router;
