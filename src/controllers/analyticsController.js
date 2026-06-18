const Scheme = require('../models/Scheme');
const User = require('../models/User');
const ChatHistory = require('../models/ChatHistory');

// @desc    Get public analytics / stats
// @route   GET /api/analytics/stats
// @access  Public
const getPublicStats = async (req, res, next) => {
  try {
    const [totalSchemes, totalUsers, totalCategories] = await Promise.all([
      Scheme.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      Scheme.distinct('category'),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalSchemes,
        totalUsers,
        totalCategories: totalCategories.length,
        states: 28,
        languages: 4,
      },
    });
  } catch (error) { next(error); }
};

// @desc    Track scheme view
// @route   POST /api/analytics/track-view
// @access  Private
const trackSchemeView = async (req, res, next) => {
  try {
    const { schemeId } = req.body;
    await Scheme.findByIdAndUpdate(schemeId, { $inc: { viewCount: 1 } });
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
};

module.exports = { getPublicStats, trackSchemeView };