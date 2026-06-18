const AgricultureScheme = require('../models/AgricultureScheme');
const { detectPlantDisease, getFertilizerRecommendation } = require('../services/agricultureAIService');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get agriculture schemes with search, filter, sort
// @route   GET /api/agriculture/schemes
// @access  Public
const getAgricultureSchemes = async (req, res, next) => {
  try {
    const {
      search, type, state, cropType, page = 1, limit = 12,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const query = { isActive: true };
    if (search) query.$text = { $search: search };
    if (type) query.type = type;
    if (state) query.$or = [
      { 'eligibility.state': { $in: [state] } },
      { 'eligibility.state': { $size: 0 } },
    ];
    if (cropType) query['eligibility.cropTypes'] = { $in: [cropType] };

    const sortOptions = search ? { score: { $meta: 'textScore' } } : { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [schemes, total] = await Promise.all([
      AgricultureScheme.find(query, search ? { score: { $meta: 'textScore' } } : {})
        .sort(sortOptions).skip(skip).limit(limitNum),
      AgricultureScheme.countDocuments(query),
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

// @desc    Get single agriculture scheme
// @route   GET /api/agriculture/schemes/:id
// @access  Public
const getAgricultureScheme = async (req, res, next) => {
  try {
    const scheme = await AgricultureScheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found.' });
    res.status(200).json({ success: true, scheme });
  } catch (error) { next(error); }
};

// @desc    Detect plant disease from image
// @route   POST /api/agriculture/detect-disease
// @access  Private
const detectDisease = async (req, res, next) => {
  try {
    const { language = 'en' } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a crop image.' });
    }

    // Convert uploaded image to base64
    let imageBase64;
    if (req.file.buffer) {
      imageBase64 = req.file.buffer.toString('base64');
    } else if (req.file.path) {
      const fileBuffer = fs.readFileSync(req.file.path);
      imageBase64 = fileBuffer.toString('base64');
    } else {
      // Cloudinary already uploaded - fetch URL and use path
      imageBase64 = req.file.path;
    }

    const result = await detectPlantDisease(imageBase64, language);

    res.status(200).json({
      success: true,
      imageUrl: req.file.path || req.file.secure_url || '',
      analysis: result,
    });
  } catch (error) { next(error); }
};

// @desc    Get fertilizer recommendations
// @route   POST /api/agriculture/fertilizer-recommendation
// @access  Private
const getFertilizerRec = async (req, res, next) => {
  try {
    const { cropType, soilCondition, disease, language = 'en' } = req.body;

    if (!cropType) {
      return res.status(400).json({ success: false, message: 'Crop type is required.' });
    }

    const recommendations = await getFertilizerRecommendation(cropType, soilCondition, disease, language);

    res.status(200).json({ success: true, recommendations });
  } catch (error) { next(error); }
};

// Admin CRUD
const createAgricultureScheme = async (req, res, next) => {
  try {
    const scheme = await AgricultureScheme.create(req.body);
    res.status(201).json({ success: true, scheme });
  } catch (error) { next(error); }
};

const updateAgricultureScheme = async (req, res, next) => {
  try {
    const scheme = await AgricultureScheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found.' });
    res.status(200).json({ success: true, scheme });
  } catch (error) { next(error); }
};

const deleteAgricultureScheme = async (req, res, next) => {
  try {
    await AgricultureScheme.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Agriculture scheme deactivated.' });
  } catch (error) { next(error); }
};

module.exports = {
  getAgricultureSchemes, getAgricultureScheme, detectDisease,
  getFertilizerRec, createAgricultureScheme, updateAgricultureScheme, deleteAgricultureScheme,
};