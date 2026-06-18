const Admin = require('../models/Admin');
const User = require('../models/User');
const Scheme = require('../models/Scheme');
const Scholarship = require('../models/Scholarship');
const AgricultureScheme = require('../models/AgricultureScheme');
const ServiceCenter = require('../models/ServiceCenter');
const ChatHistory = require('../models/ChatHistory');
const { generateToken } = require('../utils/jwt');

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Must select password explicitly since select: false in schema
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin account is deactivated.' });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = generateToken({ id: admin._id, role: 'admin' });

    res.status(200).json({
      success: true,
      message: 'Admin login successful!',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard analytics
// @route   GET /api/admin/analytics
// @access  Admin
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSchemes,
      totalScholarships,
      totalAgriSchemes,
      totalServiceCenters,
      totalChatSessions,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Scheme.countDocuments({ isActive: true }),
      Scholarship.countDocuments({ isActive: true }),
      AgricultureScheme.countDocuments({ isActive: true }),
      ServiceCenter.countDocuments({ isActive: true }),
      ChatHistory.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email state occupation createdAt'),
    ]);

    // Users by state
    const usersByState = await User.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Users by occupation
    const usersByOccupation = await User.aggregate([
      { $group: { _id: '$occupation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Schemes by category
    const schemesByCategory = await Scheme.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Monthly registrations (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top viewed schemes
    const topSchemes = await Scheme.find({ isActive: true })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('schemeName category viewCount applyCount');

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalUsers,
          activeUsers,
          totalSchemes,
          totalScholarships,
          totalAgriSchemes,
          totalServiceCenters,
          totalChatSessions,
        },
        usersByState,
        usersByOccupation,
        schemesByCategory,
        monthlyRegistrations,
        topSchemes,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res, next) => {
  try {
    const {
      search, state, occupation,
      page = 1, limit = 20,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }
    if (state) query.state = { $regex: state, $options: 'i' };
    if (occupation) query.occupation = occupation;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { adminLogin, getAnalytics, getUsers, toggleUserStatus };