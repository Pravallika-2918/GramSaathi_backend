const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  nameHi: { type: String, default: '' },
  nameTe: { type: String, default: '' },
  nameTa: { type: String, default: '' },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  eligibility: {
    minClass: { type: String, default: '' },
    maxClass: { type: String, default: '' },
    degree: [{ type: String }],
    stream: [{ type: String }],
    maxFamilyIncome: { type: Number, default: 99999999 },
    category: [{ type: String }],
    gender: { type: String, enum: ['Male', 'Female', 'All'], default: 'All' },
    state: [{ type: String }],
    minPercentage: { type: Number, default: 0 },
  },
  deadline: { type: String, default: 'Ongoing' },
  documents: [{ type: String }],
  applicationLink: { type: String, default: '' },
  ministry: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Pre-Matric', 'Post-Matric', 'Merit', 'Means-cum-Merit', 'Fellowship', 'Other'],
    default: 'Other',
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

scholarshipSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Scholarship', scholarshipSchema);