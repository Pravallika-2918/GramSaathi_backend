const express = require('express');
const router = express.Router();
const {
  getScholarships, getScholarship, findMatchingForUser,
  createScholarship, updateScholarship, deleteScholarship,
} = require('../controllers/scholarshipController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');
const { validateScholarship } = require('../middleware/validationMiddleware');

router.get('/', getScholarships);
router.post('/match', protect, findMatchingForUser);
router.get('/:id', getScholarship);

// Admin
router.post('/', adminProtect, validateScholarship, createScholarship);
router.put('/:id', adminProtect, updateScholarship);
router.delete('/:id', adminProtect, deleteScholarship);

module.exports = router;