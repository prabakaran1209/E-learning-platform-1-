require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const seedDatabase = require('./seed/seedData');

// Route imports
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const noteRoutes = require('./routes/noteRoutes');
const videoRoutes = require('./routes/videoRoutes');
const quizRoutes = require('./routes/quizRoutes');
const enrolmentRoutes = require('./routes/enrolmentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/enrolments', enrolmentRoutes);
app.use('/api/admin', adminRoutes);

// Pretty URL aliases for HTML pages
const pages = [
  'index',
  'register',
  'login',
  'student-dashboard',
  'courses',
  'course-details',
  'notes',
  'videos',
  'quizzes',
  'quiz-result',
  'enrolments',
  'progress',
  'admin-dashboard',
  'manage-courses',
  'manage-materials',
  'manage-quizzes',
  'manage-students',
  'app',
  'links'
];

pages.forEach((page) => {
  const routePath = page === 'index' ? '/' : `/${page}`;
  app.get(routePath, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', `${page}.html`));
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 E-Learning Portal Server running on http://localhost:${PORT}`);
      console.log(`📚 Web App Ready: http://localhost:${PORT}/index.html`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to bootstrap application:', err.message);
    process.exit(1);
  }
};

startServer();

