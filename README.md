# 🎓 EduPortal - Modern E-Learning Management System

A complete, modern, responsive, and fully functional **E-Learning Management Portal** built for college-level full-stack web development. The platform provides structured course materials, video lectures, online MCQ quizzes with automatic grading, and real-time student learning progress tracking.

---

## 🌟 Key Features & Modules

### 1. 📚 Course Catalogue (`Module 1`)
- Browse all available accredited courses.
- Filter by Category (Web Development, AI & Machine Learning, Data Science, Cloud Computing, etc.) and Level (Beginner, Intermediate, Advanced).
- Live real-time search across course titles, keywords, and instructors.
- Detailed course view with instructor information, duration, syllabus, and enrollment status.
- Single-click course enrollment with duplicate prevention.

### 2. 📄 Notes & Study Materials (`Module 2`)
- Course-wise and subject-wise study material repository.
- PDF lecture notes upload via Multer for administrators.
- Instant in-browser preview and one-click PDF downloads for students.
- Organized by subject, chapter, and topic with file size and timestamp display.

### 3. 🎥 Video Learning (`Module 3`)
- Embedded YouTube video player in 16:9 responsive aspect ratio.
- Interactive playlist navigation by course and topic.
- **"Mark Lesson Completed"** feature: records completion status directly into MongoDB and recalculates student course progress.

### 4. 🧠 Online MCQ Quizzes (`Module 4`)
- Multiple-choice questions with 4 answer options.
- Countdown timer based on quiz duration.
- Interactive question navigation and answered-status tracking.
- Instant automated scoring upon submission with total marks, percentage, and Pass/Fail badge.
- Detailed post-quiz answer breakdown with answer explanations for every question.
- Historical quiz attempt log stored in MongoDB.

### 5. 🎓 Student Enrolment (`Module 5`)
- Role-based registration and secure JWT authentication with bcrypt password hashing.
- Active enrollment directory displaying enrollment dates and course progress bars.
- One-click access to enrolled course materials, videos, and quizzes.

### 6. 📈 Learning Progress Tracking (`Module 6`)
- Real-time progress bar calculation based on completed video lessons and quiz attempts.
- Personalized student metrics: Total Enrolled Courses, Completed Courses, Lessons Finished, and Average Quiz Score.
- Course completion status badges (`Completed` vs `In Progress`).
- Complete historical quiz submission log with grades and timestamps.

### 7. 🛡️ User Roles & Admin Control (`Module 7`)
- **Student**: Register, login, browse catalogue, enroll, stream video lectures, download notes, take quizzes, view results, and track learning progress.
- **Admin**:
  - Add, update, and delete courses with thumbnail upload.
  - Upload PDF notes and attach to courses.
  - Add educational video links and set syllabus sequence order.
  - Create multiple-choice quizzes with 4 options, answer key, and explanations.
  - View registered student roster with completion statistics and account management.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), JSON
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM (includes embedded MongoMemoryServer fallback for zero-configuration startup)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **File Uploads**: Multer (PDF documents and image thumbnails)
- **Styling**: Modern UI/UX design system with light-blue background, blue & purple accents, rounded cards, and responsive sidebar navigation.

---

## 📁 Project Structure

```
WT project/
├── .env                          # Environment variables
├── package.json                  # Dependencies and scripts
├── server.js                     # Main Express server entry point
├── config/
│   └── db.js                     # Resilient MongoDB connection handler
├── middleware/
│   ├── auth.js                   # JWT verification & role-based authorization
│   └── upload.js                 # Multer storage configuration for PDFs & images
├── models/
│   ├── User.js                   # User collection (Students & Admins)
│   ├── Course.js                 # Course catalogue schema
│   ├── Note.js                   # Study materials & PDF notes
│   ├── Video.js                  # Video lessons with YouTube IDs
│   ├── Quiz.js                   # MCQ questions and answer key
│   ├── QuizAttempt.js            # Student quiz evaluation results
│   └── Enrolment.js              # Student course progress & completed lessons
├── controllers/
│   ├── authController.js         # Register, Login, Profile
│   ├── courseController.js       # Course CRUD, filtering, metadata
│   ├── noteController.js         # PDF note upload and listing
│   ├── videoController.js        # Video lessons and lesson completion
│   ├── quizController.js         # Quiz taking, auto-scoring, results
│   ├── enrolmentController.js    # Student enrolment & progress aggregation
│   └── adminController.js        # Admin metrics and student roster
├── routes/
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── noteRoutes.js
│   ├── videoRoutes.js
│   ├── quizRoutes.js
│   ├── enrolmentRoutes.js
│   └── adminRoutes.js
├── seed/
│   └── seedData.js               # Auto-seeding script with courses, notes & quizzes
├── uploads/
│   ├── notes/                    # Uploaded PDF lecture notes
│   └── thumbnails/               # Uploaded course thumbnail images
└── public/
    ├── css/
    │   ├── style.css             # Design system, typography, cards, buttons
    │   └── dashboard.css         # Sidebar layouts, tables, video player, quizzes
    ├── js/
    │   ├── api.js                # Central API client & Auth state helper
    │   └── navbar.js             # Dynamic top navigation updater
    ├── index.html                # 1. Landing Page
    ├── register.html             # 2. Student Registration
    ├── login.html                # 3. Login
    ├── student-dashboard.html    # 4. Student Dashboard
    ├── courses.html              # 5. Course Catalogue
    ├── course-details.html       # 6. Course Details
    ├── notes.html                # 7. Study Materials
    ├── videos.html               # 8. Video Learning
    ├── quizzes.html              # 9. Quiz Module
    ├── quiz-result.html          # 10. Quiz Results
    ├── enrolments.html           # 11. My Enrolled Courses
    ├── progress.html             # 12. Learning Progress
    ├── admin-dashboard.html      # 13. Admin Dashboard
    ├── manage-courses.html       # 14. Course Management
    ├── manage-materials.html     # 15. Notes & Video Management
    ├── manage-quizzes.html       # 16. Quiz Management
    └── manage-students.html      # 17. Student Management
```

---

## 🔑 Pre-Configured Demo Credentials

The application auto-seeds sample data on first start:

| Role | Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@elearn.com` | `admin123` | Full admin control, course & quiz management |
| **Student** | `student@elearn.com` | `student123` | Student dashboard, course progress, quizzes |
| **Student 2** | `sarah@elearn.com` | `student123` | Alternate student account |

*Note: The login page also features one-click demo filler buttons for instant evaluation.*

---

## 🚀 How to Run the Project

1. Open a terminal in the project directory.
2. Ensure dependencies are installed (already installed in this environment):
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   node server.js
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

---

## 📡 REST API Summary

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Courses**: `GET /api/courses`, `GET /api/courses/:id`, `POST /api/courses`, `PUT /api/courses/:id`, `DELETE /api/courses/:id`
- **Notes**: `GET /api/notes`, `GET /api/notes/:id`, `POST /api/notes`, `DELETE /api/notes/:id`
- **Videos**: `GET /api/videos`, `POST /api/videos`, `POST /api/videos/:id/complete` (marks lesson completed in MongoDB)
- **Quizzes**: `GET /api/quizzes`, `GET /api/quizzes/:id`, `POST /api/quizzes/:id/submit`, `GET /api/quizzes/attempts/:id`
- **Enrolment & Progress**: `POST /api/enrolments`, `GET /api/enrolments/my-courses`, `GET /api/enrolments/progress`
- **Admin**: `GET /api/admin/stats`, `GET /api/admin/students`, `DELETE /api/admin/students/:id`

#   E - l e a r n i n g - p l a t f o r m - 1 -  
 