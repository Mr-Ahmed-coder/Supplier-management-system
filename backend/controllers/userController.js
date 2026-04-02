const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return next(new AppError('Please add all fields', 400));
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('User already exists', 400));
  }

  const user = await User.create({ username, email, password });
  if (!user) {
    return next(new AppError('Invalid user data', 400));
  }
  
  res.status(201).json({
    _id: user.id, username: user.username, email: user.email, role: user.role,
    token: generateToken(user._id)
  });
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid credentials', 401));
  }

  res.json({
    _id: user.id, username: user.username, email: user.email, role: user.role,
    token: generateToken(user._id)
  });
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = catchAsync(async (req, res, next) => {
  res.status(200).json(req.user);
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  // Prevent admin from deleting themselves accidentally
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('Cannot delete yourself', 400));
  }
  await user.deleteOne();
  res.json({ message: 'User removed' });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  user.role = req.body.role || 'User';
  const updatedUser = await user.save();
  
  res.json({ message: 'User role updated', role: updatedUser.role });
});

// @desc    Change user password
// @route   POST /api/users/change-password
// @access  Private
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new AppError('Please provide current password, new password, and confirm password', 400));
  }
  
  if (newPassword !== confirmPassword) {
    return next(new AppError('New passwords do not match', 400));
  }
  
  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters long', 400));
  }

  const user = await User.findById(req.user._id);

  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

module.exports = { registerUser, loginUser, getMe, getUsers, deleteUser, updateUserRole, changePassword };
