const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  schemeName: {
    type: String,
    required: [true, 'Scheme name is required'],
    trim: true,
    index: true,
  },
  schemeNameHi: { type: String, default: '' },
  schemeNameTe: { type: String, default: '' },
  schemeNameTa: { type: String, default: '' },
  category: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  description: { type: String, default: '' },
  descriptionHi: { type: String, default: '' },
  descriptionTe: { type: String, default: '' },
  descriptionTa: { type: String, default: '' },
  benefits: { type: String, default: '' },
  benefitsHi: { type: String, default: '' },
  benefitsTe: { type: String, default: '' },
  benefitsTa: { type: String, default: '' },
  eligibility: {
    minAge: { type: Number, default: 0 },
    maxAge: { type: Number, default: 150 },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'All'], default: 'All' },
    minIncome: { type: Number, default: 0 },
    maxIncome: { type: Number, default: 99999999 },
    occupation: [{ type: String }],
    category: [{ type: String }],
    state: [{ type: String }],
    educationLevel: [{ type: String }],
    maritalStatus: [{ type: String }],
  },
  documentsRequired: [{ type: String }],
  applicationLink: { type: String, default: '' },
  applicationProcess: { type: String, default: '' },
  eligibilityText: {type: String, default: ''},

level: {type: String, enum: ['Central', 'State', 'District', 'Other'],default: 'Other'},

tags: [{
    type: String
  }],
  applicationDeadline: { type: String, default: 'Ongoing' },
  ministry: { type: String, default: '' },
  launchDate: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  applyCount: { type: Number, default: 0 },
}, { timestamps: true });

schemeSchema.index({ schemeName: 'text', description: 'text', category: 'text', ministry: 'text',eligibilityText: 'text',tags: [{type: String}] });

module.exports = mongoose.model('Scheme', schemeSchema);