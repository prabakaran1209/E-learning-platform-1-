const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: 60
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },

  // Instructor-specific Profile Attributes
  department: {
    type: String,
    default: ''
  },
  designation: {
    type: String,
    default: '' // e.g. Assistant Professor, Lead Course Instructor
  },
  qualification: {
    type: String,
    default: '' // e.g. Ph.D. in Computer Science, M.S. Software Engineering
  },
  expertise: {
    type: [String],
    default: [] // e.g. ['React', 'Node.js', 'Distributed Systems']
  },
  officeHours: {
    type: String,
    default: ''
  },

  // Student-specific Profile Attributes
  studentId: {
    type: String,
    default: '' // e.g. STU-2026-1042
  },
  major: {
    type: String,
    default: '' // e.g. Computer Science & Engineering
  },
  batchYear: {
    type: String,
    default: '2026'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
