const mongoose = require('mongoose');

const agricultureSchemeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameHi: { type: String, default: '' },
  nameTe: { type: String, default: '' },
  nameTa: { type: String, default: '' },
  type: {
    type: String,
    enum: ['Subsidy', 'Insurance', 'Loan', 'Training', 'Equipment', 'Seed', 'Fertilizer', 'Other'],
    required: true,
  },
  description: { type: String, default: '' },
  benefits: { type: String, default: '' },
  eligibility: {
    cropTypes: [{ type: String }],
    minLandSize: { type: Number, default: 0 },
    maxLandSize: { type: Number, default: 99999 },
    maxIncome: { type: Number, default: 99999999 },
    state: [{ type: String }],
    farmingCategory: [{ type: String }],
  },
  documentsRequired: [{ type: String }],
  applicationLink: { type: String, default: '' },
  applicationProcess: { type: String, default: '' },
  deadline: { type: String, default: 'Ongoing' },
  ministry: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

agricultureSchemeSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('AgricultureScheme', agricultureSchemeSchema);