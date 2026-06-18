const express = require('express');
const router = express.Router();
const {
  getNearbyCenters, getPlaceDetails, getServiceCenters,
  createServiceCenter, updateServiceCenter, deleteServiceCenter,
} = require('../controllers/serviceCenterController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

router.get('/', getServiceCenters);
router.get('/nearby', protect, getNearbyCenters);
router.get('/place/:placeId', protect, getPlaceDetails);

// Admin
router.post('/', adminProtect, createServiceCenter);
router.put('/:id', adminProtect, updateServiceCenter);
router.delete('/:id', adminProtect, deleteServiceCenter);

module.exports = router;