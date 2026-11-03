const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  getInstructorCourses,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadThumbnail } = require('../middleware/upload');

router.get('/', optionalAuth, getAllCourses);
router.get('/instructor/my-courses', protect, authorize('instructor', 'admin'), getInstructorCourses);
router.get('/:id', optionalAuth, getCourseById);

router.post('/', protect, authorize('admin', 'instructor'), uploadThumbnail.single('thumbnailFile'), createCourse);
router.put('/:id', protect, authorize('admin', 'instructor'), uploadThumbnail.single('thumbnailFile'), updateCourse);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteCourse);

module.exports = router;
