const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getDashboard, saveScheme, saveScholarship, addRecentSearch } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfilePhoto } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, uploadLimiter, uploadProfilePhoto.single('profilePhoto'), updateProfile);
router.get('/dashboard', protect, getDashboard);
router.post('/save-scheme/:schemeId', protect, saveScheme);
router.post('/save-scholarship/:id', protect, saveScholarship);
router.post('/recent-search', protect, addRecentSearch);

module.exports = router;