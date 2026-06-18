const express = require('express');
const router = express.Router();
const {
  sendMessage, getChatHistory, getChatSession,
  deleteChatSession, getSuggestedQuestions,
} = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimiter');

router.post('/message', protect, chatLimiter, sendMessage);
router.get('/history', protect, getChatHistory);
router.get('/suggestions', protect, getSuggestedQuestions);
router.get('/history/:sessionId', protect, getChatSession);
router.delete('/history/:sessionId', protect, deleteChatSession);

module.exports = router;