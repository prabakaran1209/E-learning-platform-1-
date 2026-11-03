/**
 * E-Learning Management Portal - API Client & Core Utilities
 */

const API_BASE = '/api';

// Authentication Storage Helpers
const Auth = {
  getToken: () => localStorage.getItem('elearn_token'),
  getUser: () => {
    const u = localStorage.getItem('elearn_user');
    return u ? JSON.parse(u) : null;
  },
  setAuth: (token, user) => {
    localStorage.setItem('elearn_token', token);
    localStorage.setItem('elearn_user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('elearn_token');
    localStorage.removeItem('elearn_user');
  },
  isLoggedIn: () => !!localStorage.getItem('elearn_token'),
  isAdmin: () => {
    const user = Auth.getUser();
    return user && user.role === 'admin';
  },
  logout: () => {
    Auth.clearAuth();
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 500);
  },
  requireAuth: (requiredRole = null) => {
    if (!Auth.isLoggedIn()) {
      showToast('Please log in to continue', 'warning');
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return false;
    }
    if (requiredRole && Auth.getUser().role !== requiredRole) {
      showToast('Access denied for this user role', 'error');
      if (Auth.isAdmin()) {
        window.location.href = '/admin-dashboard.html';
      } else {
        window.location.href = '/student-dashboard.html';
      }
      return false;
    }
    return true;
  }
};

// Toast Notifications System
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Universal Fetch Wrapper
async function apiRequest(endpoint, method = 'GET', data = null, isFormData = false) {
  const headers = {};
  const token = Auth.getToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };

  if (data) {
    if (isFormData) {
      config.body = data; // Multer FormData, browser sets multipart boundary automatically
    } else {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(data);
    }
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401 && Auth.isLoggedIn()) {
        Auth.clearAuth();
        window.location.href = '/login.html';
      }
      throw new Error(json.message || `Request failed with status ${res.status}`);
    }

    return json;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err.message);
    throw err;
  }
}

// API Endpoints Object
const API = {
  // Auth
  register: (userData) => apiRequest('/auth/register', 'POST', userData),
  login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
  getMe: () => apiRequest('/auth/me', 'GET'),
  updateProfile: (profileData) => apiRequest('/auth/profile', 'PUT', profileData),

  // Courses
  getCourses: (params = '') => apiRequest(`/courses${params}`, 'GET'),
  getCourse: (id) => apiRequest(`/courses/${id}`, 'GET'),
  createCourse: (formData) => apiRequest('/courses', 'POST', formData, true),
  updateCourse: (id, formData) => apiRequest(`/courses/${id}`, 'PUT', formData, true),
  deleteCourse: (id) => apiRequest(`/courses/${id}`, 'DELETE'),

  // Notes
  getNotes: (params = '') => apiRequest(`/notes${params}`, 'GET'),
  getNote: (id) => apiRequest(`/notes/${id}`, 'GET'),
  createNote: (formData) => apiRequest('/notes', 'POST', formData, true),
  deleteNote: (id) => apiRequest(`/notes/${id}`, 'DELETE'),

  // Videos
  getVideos: (params = '') => apiRequest(`/videos${params}`, 'GET'),
  getVideo: (id) => apiRequest(`/videos/${id}`, 'GET'),
  createVideo: (videoData) => apiRequest('/videos', 'POST', videoData),
  updateVideo: (id, videoData) => apiRequest(`/videos/${id}`, 'PUT', videoData),
  deleteVideo: (id) => apiRequest(`/videos/${id}`, 'DELETE'),
  markLessonComplete: (videoId) => apiRequest(`/videos/${videoId}/complete`, 'POST'),

  // Quizzes
  getQuizzes: (params = '') => apiRequest(`/quizzes${params}`, 'GET'),
  getQuiz: (id) => apiRequest(`/quizzes/${id}`, 'GET'),
  submitQuiz: (id, answers) => apiRequest(`/quizzes/${id}/submit`, 'POST', { answers }),
  getQuizResult: (attemptId) => apiRequest(`/quizzes/attempts/${attemptId}`, 'GET'),
  getMyQuizResults: () => apiRequest('/quizzes/my-results', 'GET'),
  createQuiz: (quizData) => apiRequest('/quizzes', 'POST', quizData),
  deleteQuiz: (id) => apiRequest(`/quizzes/${id}`, 'DELETE'),

  // Enrolments & Learning Progress
  enrollCourse: (courseId) => apiRequest('/enrolments', 'POST', { courseId }),
  getMyEnrolments: () => apiRequest('/enrolments/my-courses', 'GET'),
  getMyProgress: () => apiRequest('/enrolments/progress', 'GET'),

  // Admin
  getAdminStats: () => apiRequest('/admin/stats', 'GET'),
  getAdminStudents: () => apiRequest('/admin/students', 'GET'),
  deleteStudent: (studentId) => apiRequest(`/admin/students/${studentId}`, 'DELETE')
};

