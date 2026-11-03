const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const notesDir = path.join(__dirname, '..', 'uploads', 'notes');
const thumbnailsDir = path.join(__dirname, '..', 'uploads', 'thumbnails');

if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
}
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Storage for Notes (PDFs)
const notesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, notesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, 'note-' + uniqueSuffix + '-' + cleanName);
  }
});

// Storage for Thumbnails (Images)
const thumbnailStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, thumbnailsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'thumb-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// PDF Filter
const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf' || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF documents are allowed for notes!'), false);
  }
};

// Image Filter
const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP, SVG) are allowed!'), false);
  }
};

const uploadNote = multer({
  storage: notesStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: pdfFilter
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter
});

module.exports = {
  uploadNote,
  uploadThumbnail
};

