const UploadedDocument = require('../models/UploadedDocument');
const Scheme = require('../models/Scheme');
const { generateDocumentChecklist } = require('../utils/pdfGenerator');

// @desc    Get document checklist for a scheme
// @route   GET /api/documents/checklist/:schemeId
// @access  Private
const getChecklist = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.schemeId);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found.' });

    const userDocuments = await UploadedDocument.find({ userId: req.user.id });
    const uploadedTypes = userDocuments.map((d) => d.documentType);

    const checklist = scheme.documentsRequired.map((doc) => ({
      name: doc,
      uploaded: uploadedTypes.includes(doc),
    }));

    res.status(200).json({
      success: true,
      scheme: { name: scheme.schemeName, category: scheme.category },
      checklist,
      completionPercentage: Math.round((checklist.filter((c) => c.uploaded).length / checklist.length) * 100) || 0,
    });
  } catch (error) { next(error); }
};

// @desc    Download checklist as PDF
// @route   GET /api/documents/checklist/:schemeId/download
// @access  Private
const downloadChecklist = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.schemeId);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found.' });

    const pdfBuffer = await generateDocumentChecklist(scheme, scheme.documentsRequired, req.user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="checklist-${scheme.schemeName.replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) { next(error); }
};

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const { documentType, schemeId } = req.body;
    if (!documentType) return res.status(400).json({ success: false, message: 'Document type is required.' });

    const doc = await UploadedDocument.create({
      userId: req.user.id,
      schemeId: schemeId || null,
      documentType,
      fileName: req.file.originalname,
      fileUrl: req.file.path || req.file.secure_url,
      cloudinaryId: req.file.filename || req.file.public_id || '',
      fileSize: req.file.size || 0,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({ success: true, message: 'Document uploaded successfully.', document: doc });
  } catch (error) { next(error); }
};

// @desc    Get all documents for user
// @route   GET /api/documents
// @access  Private
const getUserDocuments = async (req, res, next) => {
  try {
    const documents = await UploadedDocument.find({ userId: req.user.id })
      .populate('schemeId', 'schemeName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: documents.length, documents });
  } catch (error) { next(error); }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res, next) => {
  try {
    const doc = await UploadedDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    if (doc.cloudinaryId) {
      const cloudinary = require('../config/cloudinary');
      await cloudinary.uploader.destroy(doc.cloudinaryId).catch(() => {});
    }

    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Document deleted.' });
  } catch (error) { next(error); }
};

module.exports = { getChecklist, downloadChecklist, uploadDocument, getUserDocuments, deleteDocument };