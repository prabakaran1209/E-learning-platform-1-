const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Course = require('../models/Course');
const Note = require('../models/Note');
const Video = require('../models/Video');
const Quiz = require('../models/Quiz');
const Enrolment = require('../models/Enrolment');
const QuizAttempt = require('../models/QuizAttempt');

// Simple helper to create a valid minimal dummy PDF if not existing
const createDummyPdf = (filePath, titleText) => {
  if (!fs.existsSync(filePath)) {
    // Minimal standard PDF header/body
    const minimalPdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj <</Length 110>> stream
BT
/F1 24 Tf
100 700 Td
(${titleText}) Tj
ET
endstream
endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000407 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
485
%%EOF`;
    fs.writeFileSync(filePath, minimalPdf, 'utf-8');
  }
};

const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('ℹ️ Database already has data. Skipping automatic seed.');
      return;
    }

    console.log('🌱 Seeding database with initial college-level curriculum and users...');

    // Ensure uploads directory exists
    const notesUploadDir = path.join(__dirname, '..', 'uploads', 'notes');
    if (!fs.existsSync(notesUploadDir)) {
      fs.mkdirSync(notesUploadDir, { recursive: true });
    }

    // 1. Create Admin & Student Users
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@elearn.com',
      password: 'admin123',
      role: 'admin',
      bio: 'Lead portal coordinator and curriculum administrator.'
    });

    const studentUser = await User.create({
      name: 'Alex Morgan',
      email: 'student@elearn.com',
      password: 'student123',
      role: 'student',
      bio: 'Computer Science undergraduate student passionate about Web Development and Cloud Computing.'
    });

    const studentUser2 = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah@elearn.com',
      password: 'student123',
      role: 'student',
      bio: 'Information Technology major specializing in Artificial Intelligence.'
    });

    // 2. Create Courses
    const course1 = await Course.create({
      title: 'Full-Stack Modern Web Development',
      description: 'Master HTML5, modern CSS3, responsive layouts, asynchronous JavaScript, Node.js, Express, and MongoDB to build production-grade web applications.',
      instructor: 'Dr. Angela Roberts',
      category: 'Web Development',
      duration: '8 Weeks',
      level: 'Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&auto=format&fit=crop&q=80',
      isAvailable: true,
      totalLessons: 4,
      createdBy: adminUser._id
    });

    const course2 = await Course.create({
      title: 'Machine Learning & AI with Python',
      description: 'Comprehensive study of supervised and unsupervised learning, mathematical formulations, neural networks, computer vision, and model evaluation.',
      instructor: 'Prof. Michael Chang',
      category: 'AI & Machine Learning',
      duration: '10 Weeks',
      level: 'Intermediate',
      thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=80',
      isAvailable: true,
      totalLessons: 3,
      createdBy: adminUser._id
    });

    const course3 = await Course.create({
      title: 'Data Structures & Algorithms in Java',
      description: 'Strengthen problem-solving foundations: asymptotic time complexity analysis, arrays, linked lists, trees, heaps, graphs, and dynamic programming.',
      instructor: 'Dr. Rajesh Sharma',
      category: 'Programming Languages',
      duration: '6 Weeks',
      level: 'Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      isAvailable: true,
      totalLessons: 3,
      createdBy: adminUser._id
    });

    const course4 = await Course.create({
      title: 'Cloud Computing & DevOps Engineering',
      description: 'Learn modern DevOps workflows: Linux fundamentals, containerization with Docker, orchestration with Kubernetes, and CI/CD pipelines.',
      instructor: 'Sarah Connor',
      category: 'Cloud Computing',
      duration: '6 Weeks',
      level: 'Advanced',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      isAvailable: true,
      totalLessons: 3,
      createdBy: adminUser._id
    });

    // 3. Create Sample PDF files and Notes
    const pdf1Path = path.join(notesUploadDir, 'web-dev-notes-ch1.pdf');
    const pdf2Path = path.join(notesUploadDir, 'js-deep-dive-notes.pdf');
    const pdf3Path = path.join(notesUploadDir, 'ml-math-foundations.pdf');
    const pdf4Path = path.join(notesUploadDir, 'dsa-handbook.pdf');

    createDummyPdf(pdf1Path, 'Web Development Fundamentals Chapter 1');
    createDummyPdf(pdf2Path, 'JavaScript ES6 Deep Dive');
    createDummyPdf(pdf3Path, 'Machine Learning Mathematical Foundations');
    createDummyPdf(pdf4Path, 'Data Structures & Algorithms Handbook');

    await Note.create([
      {
        course: course1._id,
        title: 'HTML5 Semantic Elements & CSS Grid Architecture',
        subject: 'Web Technologies',
        topic: 'Modern Responsive Layouts',
        description: 'Complete reference notes on semantic markup, flexbox alignment, and CSS Grid templates.',
        fileUrl: '/uploads/notes/web-dev-notes-ch1.pdf',
        originalName: 'HTML5_CSS_Grid_Architecture.pdf',
        fileSize: '1.4 MB',
        uploadedBy: adminUser._id
      },
      {
        course: course1._id,
        title: 'JavaScript Asynchronous Programming (Promises & Async/Await)',
        subject: 'Web Technologies',
        topic: 'Async JavaScript',
        description: 'Deep dive into JavaScript event loops, fetch API, promises, and modern asynchronous patterns.',
        fileUrl: '/uploads/notes/js-deep-dive-notes.pdf',
        originalName: 'JS_Async_Await_Guide.pdf',
        fileSize: '2.1 MB',
        uploadedBy: adminUser._id
      },
      {
        course: course2._id,
        title: 'Supervised Learning & Gradient Descent Calculus',
        subject: 'Artificial Intelligence',
        topic: 'Regression & Optimization',
        description: 'Lecture notes covering cost functions, derivatives, gradient descent algorithms, and convergence.',
        fileUrl: '/uploads/notes/ml-math-foundations.pdf',
        originalName: 'ML_Gradient_Descent_Calculus.pdf',
        fileSize: '3.5 MB',
        uploadedBy: adminUser._id
      },
      {
        course: course3._id,
        title: 'Complete Tree & Graph Traversals Summary',
        subject: 'Data Structures',
        topic: 'Non-Linear Data Structures',
        description: 'Comprehensive notes covering BFS, DFS, Dijkstra algorithm, and AVL Tree balancing rotations.',
        fileUrl: '/uploads/notes/dsa-handbook.pdf',
        originalName: 'DSA_Tree_Graph_Traversals.pdf',
        fileSize: '2.8 MB',
        uploadedBy: adminUser._id
      }
    ]);

    // 4. Create Video Lessons (Real educational videos from top creators on YouTube)
    const v1 = await Video.create({
      course: course1._id,
      title: 'HTML5 Full Course - Build a Website from Scratch',
      topic: 'HTML & Semantic Markup',
      youtubeUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
      youtubeId: 'kUMe1FH4CHE',
      duration: '25 mins',
      order: 1,
      description: 'Understanding HTML tags, forms, input attributes, audio/video tags, and semantic structure.'
    });

    const v2 = await Video.create({
      course: course1._id,
      title: 'Modern CSS3 Layouts & Flexbox Masterclass',
      topic: 'CSS & Responsive Design',
      youtubeUrl: 'https://www.youtube.com/watch?v=1PnVor36_40',
      youtubeId: '1PnVor36_40',
      duration: '32 mins',
      order: 2,
      description: 'Learn modern CSS layouts, flex container properties, responsive media queries, and animations.'
    });

    const v3 = await Video.create({
      course: course1._id,
      title: 'JavaScript DOM Manipulation & Events Tutorial',
      topic: 'JavaScript Fundamentals',
      youtubeUrl: 'https://www.youtube.com/watch?v=5fb2aPlgoys',
      youtubeId: '5fb2aPlgoys',
      duration: '40 mins',
      order: 3,
      description: 'Learn how to manipulate DOM elements, handle click and submit events, and update dynamic UI.'
    });

    const v4 = await Video.create({
      course: course1._id,
      title: 'Node.js and Express REST API Crash Course',
      topic: 'Backend Architecture',
      youtubeUrl: 'https://www.youtube.com/watch?v=7H_QH9nipNs',
      youtubeId: '7H_QH9nipNs',
      duration: '45 mins',
      order: 4,
      description: 'Step-by-step creation of REST endpoints, Express routing, middleware, and JSON responses.'
    });

    // Videos for course 2
    await Video.create([
      {
        course: course2._id,
        title: 'Python for Machine Learning Crash Course',
        topic: 'Python Foundations',
        youtubeUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0',
        youtubeId: '7eh4d6sabA0',
        duration: '35 mins',
        order: 1,
        description: 'NumPy arrays, Pandas DataFrames, and data preprocessing techniques for ML.'
      },
      {
        course: course2._id,
        title: 'Supervised vs Unsupervised Learning in 20 Minutes',
        topic: 'Core ML Concepts',
        youtubeUrl: 'https://www.youtube.com/watch?v=ukzFI9rgwfU',
        youtubeId: 'ukzFI9rgwfU',
        duration: '22 mins',
        order: 2,
        description: 'Classification, regression, clustering, and anomaly detection algorithms compared.'
      },
      {
        course: course2._id,
        title: 'Neural Networks and Deep Learning Explained',
        topic: 'Deep Learning',
        youtubeUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
        youtubeId: 'aircAruvnKk',
        duration: '28 mins',
        order: 3,
        description: 'How neurons, weights, activation functions, and backpropagation function mathematically.'
      }
    ]);

    // Videos for course 3
    await Video.create([
      {
        course: course3._id,
        title: 'Big-O Notation and Time Complexity Analysis',
        topic: 'Complexity Analysis',
        youtubeUrl: 'https://www.youtube.com/watch?v=__vX2sjlpXU',
        youtubeId: '__vX2sjlpXU',
        duration: '18 mins',
        order: 1,
        description: 'Master time and space complexity with real code examples and Big-O curves.'
      },
      {
        course: course3._id,
        title: 'Linked Lists Data Structure in Depth',
        topic: 'Linear Structures',
        youtubeUrl: 'https://www.youtube.com/watch?v=F8AbOfQwl1c',
        youtubeId: 'F8AbOfQwl1c',
        duration: '24 mins',
        order: 2,
        description: 'Singly linked lists, doubly linked lists, node insertion, deletion, and reversal.'
      },
      {
        course: course3._id,
        title: 'Binary Trees and Depth-First Search Traversals',
        topic: 'Trees and Graphs',
        youtubeUrl: 'https://www.youtube.com/watch?v=fAAZixBzIAI',
        youtubeId: 'fAAZixBzIAI',
        duration: '30 mins',
        order: 3,
        description: 'Preorder, Inorder, and Postorder tree traversals with recursion and iteration.'
      }
    ]);

    // 5. Create Quizzes
    const quiz1 = await Quiz.create({
      course: course1._id,
      title: 'Web Technologies & Frontend Assessment',
      description: 'Test your understanding of modern HTML5 semantics, CSS box model, asynchronous JavaScript, and REST APIs.',
      timeLimitMinutes: 15,
      totalMarks: 100,
      passingPercentage: 60,
      questions: [
        {
          questionText: 'Which HTML5 element is most appropriate for marking up the main header navigation menu?',
          options: ['<menu>', '<nav>', '<navigation>', '<header-links>'],
          correctOption: 1,
          explanation: 'The <nav> tag is the standard semantic element specifically designated for major site navigation links.'
        },
        {
          questionText: 'In CSS box model, which property creates space outside the border of an element?',
          options: ['padding', 'outline', 'margin', 'spacing'],
          correctOption: 2,
          explanation: 'Margin adds clear space outside the border, whereas padding adds space inside the border.'
        },
        {
          questionText: 'What is the keyword used to pause JavaScript execution inside an async function until a Promise settles?',
          options: ['wait', 'defer', 'hold', 'await'],
          correctOption: 3,
          explanation: 'The "await" keyword can only be used inside async functions to synchronously wait for a Promise resolution.'
        },
        {
          questionText: 'Which HTTP method should be used for updating an existing resource partially?',
          options: ['PUT', 'POST', 'PATCH', 'UPDATE'],
          correctOption: 2,
          explanation: 'PATCH is intended for applying partial modifications to a resource, while PUT replaces the entire entity.'
        },
        {
          questionText: 'Which status code represents that a request succeeded and a new resource was created?',
          options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
          correctOption: 1,
          explanation: 'HTTP 201 Created signifies that the request succeeded and resulted in the creation of a new resource.'
        }
      ]
    });

    const quiz2 = await Quiz.create({
      course: course2._id,
      title: 'Machine Learning Fundamentals Quiz',
      description: 'Evaluate your knowledge in supervised learning, regression metrics, and gradient descent optimization.',
      timeLimitMinutes: 12,
      totalMarks: 100,
      passingPercentage: 60,
      questions: [
        {
          questionText: 'Which of the following is an example of an unsupervised learning algorithm?',
          options: ['Linear Regression', 'Support Vector Machines', 'K-Means Clustering', 'Random Forest'],
          correctOption: 2,
          explanation: 'K-Means discovers hidden patterns or clusters in unlabeled data without target ground-truth.'
        },
        {
          questionText: 'What does the learning rate (alpha) control in Gradient Descent?',
          options: ['The size of steps taken towards the minimum of the loss function', 'The number of hidden layers in a neural network', 'The ratio of training to testing data', 'The total number of iterations'],
          correctOption: 0,
          explanation: 'The learning rate determines the step magnitude in the opposite direction of the gradient during optimization.'
        },
        {
          questionText: 'Which metric is best suited for evaluating a highly imbalanced classification problem?',
          options: ['Raw Accuracy', 'Mean Squared Error', 'F1-Score / ROC-AUC', 'R-Squared'],
          correctOption: 2,
          explanation: 'F1-score balances precision and recall, providing an accurate evaluation when class distribution is skewed.'
        },
        {
          questionText: 'Overfitting occurs when a model:',
          options: ['Performs poorly on training data', 'Learns noise and details of training data too closely, failing to generalize', 'Has too few parameters', 'Undergoes excessive regularization'],
          correctOption: 1,
          explanation: 'Overfitting occurs when a model captures specific training noise, leading to high training accuracy but poor generalization on unseen test data.'
        }
      ]
    });

    // 6. Create Initial Enrolment for Alex Morgan
    const alexEnrolment = await Enrolment.create({
      student: studentUser._id,
      course: course1._id,
      enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      status: 'active',
      completedVideos: [v1._id, v2._id],
      progressPercentage: 50,
      lastAccessed: new Date()
    });

    // Create Initial Quiz Attempt for Alex Morgan
    await QuizAttempt.create({
      student: studentUser._id,
      quiz: quiz1._id,
      course: course1._id,
      answers: [
        { questionIndex: 0, questionText: quiz1.questions[0].questionText, options: quiz1.questions[0].options, selectedOption: 1, correctOption: 1, isCorrect: true, explanation: quiz1.questions[0].explanation },
        { questionIndex: 1, questionText: quiz1.questions[1].questionText, options: quiz1.questions[1].options, selectedOption: 2, correctOption: 2, isCorrect: true, explanation: quiz1.questions[1].explanation },
        { questionIndex: 2, questionText: quiz1.questions[2].questionText, options: quiz1.questions[2].options, selectedOption: 3, correctOption: 3, isCorrect: true, explanation: quiz1.questions[2].explanation },
        { questionIndex: 3, questionText: quiz1.questions[3].questionText, options: quiz1.questions[3].options, selectedOption: 2, correctOption: 2, isCorrect: true, explanation: quiz1.questions[3].explanation },
        { questionIndex: 4, questionText: quiz1.questions[4].questionText, options: quiz1.questions[4].options, selectedOption: 1, correctOption: 1, isCorrect: true, explanation: quiz1.questions[4].explanation }
      ],
      score: 5,
      totalQuestions: 5,
      percentage: 100,
      passed: true,
      attemptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    console.log('✅ Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('🔑 Admin Credentials:   email: admin@elearn.com   | password: admin123');
    console.log('🎓 Student Credentials: email: student@elearn.com | password: student123');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ Error during database seeding:', err.message);
  }
};

module.exports = seedDatabase;

