const express = require('express');
const router = express.Router();
const { adminLogin, getAnalytics, getUsers, toggleUserStatus } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, adminLogin);
router.get('/analytics', adminProtect, getAnalytics);
router.get('/users', adminProtect, getUsers);
router.put('/users/:id/toggle-status', adminProtect, toggleUserStatus);

module.exports = router;