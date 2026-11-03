const express = require('express');
const router = express.Router();
const {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  markLessonCompleted
} = require('../controllers/videoController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getAllVideos);
router.get('/:id', optionalAuth, getVideoById);
router.post('/', protect, authorize('admin', 'instructor'), createVideo);
router.put('/:id', protect, authorize('admin', 'instructor'), updateVideo);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteVideo);
router.post('/:id/complete', protect, markLessonCompleted);

module.exports = router;
