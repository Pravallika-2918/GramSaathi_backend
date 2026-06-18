const User = require('../models/User');
const { getPersonalizedRecommendations } = require('../services/recommendationService');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('savedSchemes', 'schemeName category benefits applicationDeadline')
      .populate('savedScholarships', 'name amount deadline');

    const userObj = user.toObject();
    // Normalize income
    if (userObj.income !== undefined && userObj.annualIncome === undefined) {
      userObj.annualIncome = userObj.income;
    }
    delete userObj.income;
    delete userObj.education; // remove stale field

    res.status(200).json({ success: true, user: userObj });
  } catch (error) { next(error); }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'age', 'gender', 'occupation', 'annualIncome',
      'state', 'district', 'mobile', 'maritalStatus', 'category',
      'caste', 'educationLevel', 'preferredLanguage',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) updates.profilePhoto = req.file.path;

    const user = await User.findByIdAndUpdate(
      req.user.id, updates, { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Profile updated successfully.', user });
  } catch (error) { next(error); }
};

// @desc    Get dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('savedSchemes', 'schemeName category benefits applicationDeadline')
      .populate('savedScholarships', 'name amount deadline');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const recommendations = await getPersonalizedRecommendations(user);

    res.status(200).json({
      success: true,
      dashboard: {
        user: {
          id: user._id,
          name: user.name,
          age: user.age,
          gender: user.gender,
          occupation: user.occupation,
          annualIncome: user.annualIncome ?? user.income ?? 0,
          state: user.state,
          district: user.district,
          mobile: user.mobile,
          email: user.email,
          category: user.category,
          maritalStatus: user.maritalStatus,
          educationLevel: user.educationLevel,
          preferredLanguage: user.preferredLanguage,
          profilePhoto: user.profilePhoto,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        recommendations: {
          schemes: recommendations.eligibleSchemes,
          scholarships: recommendations.eligibleScholarships,
          agricultureSchemes: recommendations.eligibleAgriSchemes,
        },
        savedSchemes: user.savedSchemes || [],
        savedScholarships: user.savedScholarships || [],
        recentSearches: user.recentSearches?.slice(0, 5) || [],
        stats: {
          savedSchemesCount: user.savedSchemes?.length || 0,
          savedScholarshipsCount: user.savedScholarships?.length || 0,
          eligibleSchemesCount: recommendations.eligibleSchemes.length,
        },
      },
    });
  } catch (error) { next(error); }
};

// @desc    Save / unsave a scheme
// @route   POST /api/users/save-scheme/:schemeId
// @access  Private
const saveScheme = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const schemeId = req.params.schemeId;

    const alreadySaved = user.savedSchemes.map((id) => id.toString()).includes(schemeId);

    if (alreadySaved) {
      user.savedSchemes = user.savedSchemes.filter((id) => id.toString() !== schemeId);
      await user.save();
      return res.status(200).json({ success: true, message: 'Scheme removed from saved list.', saved: false });
    }

    user.savedSchemes.push(schemeId);
    await user.save();
    res.status(200).json({ success: true, message: 'Scheme saved successfully.', saved: true });
  } catch (error) { next(error); }
};

// @desc    Save / unsave a scholarship
// @route   POST /api/users/save-scholarship/:id
// @access  Private
const saveScholarship = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const scholarshipId = req.params.id;

    const alreadySaved = user.savedScholarships.map((id) => id.toString()).includes(scholarshipId);

    if (alreadySaved) {
      user.savedScholarships = user.savedScholarships.filter((id) => id.toString() !== scholarshipId);
      await user.save();
      return res.status(200).json({ success: true, message: 'Scholarship removed.', saved: false });
    }

    user.savedScholarships.push(scholarshipId);
    await user.save();
    res.status(200).json({ success: true, message: 'Scholarship saved.', saved: true });
  } catch (error) { next(error); }
};

// @desc    Add to recent searches
// @route   POST /api/users/recent-search
// @access  Private
const addRecentSearch = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const user = await User.findById(req.user.id);
    user.recentSearches = [
      query.trim(),
      ...user.recentSearches.filter((s) => s !== query.trim()),
    ].slice(0, 10);

    await user.save();
    res.status(200).json({ success: true, recentSearches: user.recentSearches });
  } catch (error) { next(error); }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  saveScheme,
  saveScholarship,
  addRecentSearch,
};