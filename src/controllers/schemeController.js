const Scheme = require('../models/Scheme');
const { checkEligibility } = require('../utils/eligibilityEngine');

// @desc    Get all schemes with search, filter, sort
// @route   GET /api/schemes
// @access  Public
const getSchemes = async (req, res, next) => {
  try {
    const {
      search, category, state, gender, maxIncome,
      occupation, page = 1, limit = 12,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const query = { isActive: true };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (state) {
      query.$or = [
        { 'eligibility.state': { $in: [state] } },
        { 'eligibility.state': { $size: 0 } },
      ];
    }
    if (gender && gender !== 'All') query['eligibility.gender'] = { $in: [gender, 'All'] };
    if (maxIncome) query['eligibility.maxIncome'] = { $gte: parseInt(maxIncome) };
    if (occupation) query['eligibility.occupation'] = { $in: [occupation] };

    const sortOptions = search
      ? { score: { $meta: 'textScore' } }
      : { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [schemes, total] = await Promise.all([
      Scheme.find(query, search ? { score: { $meta: 'textScore' } } : {})
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Scheme.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: schemes.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      schemes,
    });
  } catch (error) { next(error); }
};

// @desc    Get single scheme
// @route   GET /api/schemes/:id
// @access  Public
const getScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found.' });

    await Scheme.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.status(200).json({ success: true, scheme });
  } catch (error) { next(error); }
};

// @desc    Check scheme eligibility for logged-in user
// @route   GET /api/schemes/eligible
// @access  Private
const getEligibleSchemesForUser = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;

    const schemes = await Scheme.find(query);

    // Normalize user income
    const normalizedUser = {
      ...req.user.toObject(),
      annualIncome: req.user.annualIncome ?? req.user.income ?? 0,
    };

    // Run eligibility check inline (no import needed)
    const results = schemes.map((scheme) => {
      const { isEligible, reasons } = checkEligibility(normalizedUser, scheme);
      return { ...scheme.toObject(), isEligible, ineligibilityReasons: reasons };
    }).sort((a, b) => (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0));

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = results.slice(start, start + limitNum);

    res.status(200).json({
      success: true,
      total: results.length,
      eligibleCount: results.filter((s) => s.isEligible).length,
      totalPages: Math.ceil(results.length / limitNum),
      currentPage: pageNum,
      schemes: paginated,
    });
  } catch (error) { next(error); }
};

// @desc    Get scheme categories
// @route   GET /api/schemes/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Scheme.distinct('category');
    res.status(200).json({ success: true, categories });
  } catch (error) { next(error); }
};

// @desc    Create scheme (Admin)
// @route   POST /api/schemes
// @access  Admin
const createScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.create(req.body);
    res.status(201).json({ success: true, message: 'Scheme created.', scheme });
  } catch (error) { next(error); }
};

// @desc    Update scheme (Admin)
// @route   PUT /api/schemes/:id
// @access  Admin
const updateScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found.' });
    res.status(200).json({ success: true, message: 'Scheme updated.', scheme });
  } catch (error) { next(error); }
};

// @desc    Delete scheme (Admin)
// @route   DELETE /api/schemes/:id
// @access  Admin
const deleteScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found.' });
    res.status(200).json({ success: true, message: 'Scheme deactivated.' });
  } catch (error) { next(error); }
};

module.exports = {
  getSchemes,
  getScheme,
  getEligibleSchemesForUser,
  getCategories,
  createScheme,
  updateScheme,
  deleteScheme,
};