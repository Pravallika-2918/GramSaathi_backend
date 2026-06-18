const mongoose = require('mongoose');

const uploadedDocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', default: null },
  documentType: {
    type: String,
    required: true,
    enum: [
      'Aadhaar Card', 'Income Certificate', 'Caste Certificate',
      'Residence Certificate', 'Passport Photo', 'Bank Passbook',
      'Educational Certificate', 'Land Ownership Proof',
      'Ration Card', 'Voter ID', 'PAN Card', 'Other',
    ],
  },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  cloudinaryId: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('UploadedDocument', uploadedDocumentSchema);