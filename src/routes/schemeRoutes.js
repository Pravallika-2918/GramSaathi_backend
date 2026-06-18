const express = require('express');
const router = express.Router();
const {
  getSchemes, getScheme, getEligibleSchemesForUser,
  getCategories, createScheme, updateScheme, deleteScheme,
} = require('../controllers/schemeController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');
const { validateScheme } = require('../middleware/validationMiddleware');

router.get('/', getSchemes);
router.get('/categories', getCategories);
router.get('/eligible', protect, getEligibleSchemesForUser);
router.get('/:id', getScheme);

// Admin routes
router.post('/',protect,adminProtect,validateScheme,createScheme);

router.put('/:id',protect,adminProtect,updateScheme);

router.delete( '/:id', protect, adminProtect, deleteScheme);

module.exports = router;