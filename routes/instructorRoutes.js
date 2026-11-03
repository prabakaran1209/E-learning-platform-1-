const express = require('express');
const router = express.Router();
const {
  getInstructorDashboard,
  getInstructorStudents
} = require('../controllers/instructorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('instructor', 'admin'));

router.get('/dashboard', getInstructorDashboard);
router.get('/students', getInstructorStudents);

module.exports = router;

