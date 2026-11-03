const express = require('express');
const router = express.Router();
const {
  enrollInCourse,
  getMyEnrolments,
  getMyProgress,
  getInstructorEnrolments
} = require('../controllers/enrolmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, enrollInCourse);
router.get('/my-courses', protect, getMyEnrolments);
router.get('/progress', protect, getMyProgress);
router.get('/instructor-students', protect, authorize('instructor', 'admin'), getInstructorEnrolments);

module.exports = router;
