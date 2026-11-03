const express = require('express');
const router = express.Router();
const {
  getAllNotes,
  getNoteById,
  createNote,
  deleteNote
} = require('../controllers/noteController');
const { protect, authorize } = require('../middleware/auth');
const { uploadNote } = require('../middleware/upload');

router.get('/', getAllNotes);
router.get('/:id', getNoteById);
router.post('/', protect, authorize('admin', 'instructor'), uploadNote.single('pdfFile'), createNote);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteNote);

module.exports = router;
