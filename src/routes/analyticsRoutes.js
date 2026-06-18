const express = require('express');
const router = express.Router();
const { getPublicStats, trackSchemeView } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', getPublicStats);
router.post('/track-view', protect, trackSchemeView);

module.exports = router;