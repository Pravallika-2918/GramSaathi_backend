const express = require('express');
const router = express.Router();
const {
  getChecklist, downloadChecklist, uploadDocument,
  getUserDocuments, deleteDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { uploadDocument: uploadDocMiddleware } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.get('/', protect, getUserDocuments);
router.post('/upload', protect, uploadLimiter, uploadDocMiddleware.single('document'), uploadDocument);
router.get('/checklist/:schemeId', protect, getChecklist);
router.get('/checklist/:schemeId/download', protect, downloadChecklist);
router.delete('/:id', protect, deleteDocument);

module.exports = router;