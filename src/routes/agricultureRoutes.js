const express = require('express');
const router = express.Router();
const {
  getAgricultureSchemes, getAgricultureScheme, detectDisease,
  getFertilizerRec, createAgricultureScheme, updateAgricultureScheme, deleteAgricultureScheme,
} = require('../controllers/agricultureController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');
const { uploadCropImage } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.get('/schemes', getAgricultureSchemes);
router.get('/schemes/:id', getAgricultureScheme);
router.post('/detect-disease', protect, uploadLimiter, uploadCropImage.single('cropImage'), detectDisease);
router.post('/fertilizer-recommendation', protect, getFertilizerRec);

// Admin
router.post('/schemes', adminProtect, createAgricultureScheme);
router.put('/schemes/:id', adminProtect, updateAgricultureScheme);
router.delete('/schemes/:id', adminProtect, deleteAgricultureScheme);

module.exports = router;