const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllStudents,
  getAllInstructors,
  getInteractions,
  deleteUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/students', getAllStudents);
router.get('/instructors', getAllInstructors);
router.get('/interactions', getInteractions);
router.delete('/users/:id', deleteUser);

module.exports = router;
