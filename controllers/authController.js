const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logInteraction } = require('../utils/logger');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'supersecret_jwt_elearning_key_2026_modern',
    { expiresIn: '30d' }
  );
};

// @desc Register user (Student, Instructor, or Admin)
// @route POST /api/auth/register
// @access Public
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      adminSecret,
      department,
      designation,
      qualification,
      expertise,
      studentId,
      major,
      bio,
      phone
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Role assignment logic
    let assignedRole = 'student';
    if (role === 'admin') {
      if (adminSecret && adminSecret === (process.env.ADMIN_SECRET || 'admin123')) {
        assignedRole = 'admin';
      } else if (!process.env.ADMIN_SECRET) {
        assignedRole = 'admin';
      } else {
        return res.status(403).json({
          success: false,
          message: 'Invalid Admin Secret Key. Registration as admin denied.'
        });
      }
    } else if (role === 'instructor') {
      assignedRole = 'instructor';
    }

    const userPayload = {
      name,
      email,
      password,
      role: assignedRole,
      bio: bio || '',
      phone: phone || ''
    };

    if (assignedRole === 'instructor') {
      userPayload.department = department || 'Computer Science';
      userPayload.designation = designation || 'Course Instructor';
      userPayload.qualification = qualification || 'M.Tech / Ph.D.';
      userPayload.expertise = Array.isArray(expertise) ? expertise : (expertise ? expertise.split(',').map(e => e.trim()) : []);
    } else if (assignedRole === 'student') {
      userPayload.studentId = studentId || `STU-${Date.now().toString().slice(-4)}`;
      userPayload.major = major || 'Computer Science';
    }

    const user = await User.create(userPayload);
    const token = generateToken(user._id, user.role);

    // Track user registration interaction
    await logInteraction({
      user,
      action: 'user_registered',
      category: 'authentication',
      entityId: user._id,
      entityModel: 'User',
      details: `New ${assignedRole} registered: ${user.name} (${user.email})`
    });

    res.status(201).json({
      success: true,
      message: `${assignedRole.charAt(0).toUpperCase() + assignedRole.slice(1)} account created successfully`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        studentId: user.studentId
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during registration'
    });
  }
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact administrator.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    // Track user login interaction
    await logInteraction({
      user,
      action: 'user_login',
      category: 'authentication',
      entityId: user._id,
      entityModel: 'User',
      details: `${user.role} logged in: ${user.name}`
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        studentId: user.studentId,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during login'
    });
  }
};

// @desc Get current logged in user
// @route GET /api/auth/me
// @access Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile'
    });
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      avatar,
      phone,
      department,
      designation,
      qualification,
      expertise,
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;
    if (phone) user.phone = phone;

    // Instructor attributes update
    if (user.role === 'instructor') {
      if (department) user.department = department;
      if (designation) user.designation = designation;
      if (qualification) user.qualification = qualification;
      if (expertise) {
        user.expertise = Array.isArray(expertise) ? expertise : expertise.split(',').map(e => e.trim());
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password'
        });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match'
        });
      }
      user.password = newPassword;
    }

    await user.save();

    await logInteraction({
      user,
      action: 'profile_updated',
      category: 'authentication',
      details: `${user.name} updated profile details`
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        department: user.department,
        designation: user.designation,
        qualification: user.qualification,
        expertise: user.expertise
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error updating profile'
    });
  }
};
