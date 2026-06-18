const Scholarship = require('../models/Scholarship');
const { findMatchingScholarships } = require('../services/scholarshipService');

// @desc    Get all scholarships with search, filter, sort
// @route   GET /api/scholarships
// @access  Public
const getScholarships = async (req, res, next) => {
  try {
    const {
      search, category, gender, state, stream, degree,
      maxIncome, page = 1, limit = 12, sortBy = 'amount', sortOrder = 'desc',
    } = req.query;

    const query = { isActive: true };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (gender && gender !== 'All') query['eligibility.gender'] = { $in: [gender, 'All'] };
    if (maxIncome) query['eligibility.maxFamilyIncome'] = { $gte: parseInt(maxIncome) };
    if (state) query.$or = [
      { 'eligibility.state': { $in: [state] } },
      { 'eligibility.state': { $size: 0 } },
    ];
    if (stream) query['eligibility.stream'] = { $in: [stream] };
    if (degree) query['eligibility.degree'] = { $in: [degree] };

    const sortOptions = {};
    if (search) sortOptions.score = { $meta: 'textScore' };
    else sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [scholarships, total] = await Promise.all([
      Scholarship.find(query, search ? { score: { $meta: 'textScore' } } : {})
        .sort(sortOptions).skip(skip).limit(limitNum),
      Scholarship.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: scholarships.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      scholarships,
    });
  } catch (error) { next(error); }
};

// @desc    Get single scholarship
// @route   GET /api/scholarships/:id
// @access  Public
const getScholarship = async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ success: false, message: 'Scholarship not found.' });
    res.status(200).json({ success: true, scholarship });
  } catch (error) { next(error); }
};

// @desc    Find matching scholarships for user profile
// @route   POST /api/scholarships/match
// @access  Private
const findMatchingForUser = async (req, res, next) => {
  try {
    const filters = req.body || {};
    // Use user profile as base
    const userFilters = {
      category: req.user.category,
      gender: req.user.gender,
      state: req.user.state,
      maxIncome: req.user.annualIncome,
      ...filters,
    };
    const scholarships = await findMatchingScholarships(userFilters);
    res.status(200).json({ success: true, count: scholarships.length, scholarships });
  } catch (error) { next(error); }
};

// Admin CRUD
const createScholarship = async (req, res, next) => {
  try {
    const scholarship = await Scholarship.create(req.body);
    res.status(201).json({ success: true, message: 'Scholarship created.', scholarship });
  } catch (error) { next(error); }
};

const updateScholarship = async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!scholarship) return res.status(404).json({ success: false, message: 'Scholarship not found.' });
    res.status(200).json({ success: true, scholarship });
  } catch (error) { next(error); }
};

const deleteScholarship = async (req, res, next) => {
  try {
    await Scholarship.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Scholarship deactivated.' });
  } catch (error) { next(error); }
};

module.exports = { getScholarships, getScholarship, findMatchingForUser, createScholarship, updateScholarship, deleteScholarship };