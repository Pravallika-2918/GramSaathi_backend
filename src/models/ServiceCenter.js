const mongoose = require('mongoose');

const serviceCenterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ['MeeSeva', 'Government Office', 'Hospital', 'Bank', 'Agriculture Office', 'Scholarship Help Center', 'Other'],
  },
  address: { type: String, required: true },
  district: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  pincode: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  contactNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  openingHours: { type: String, default: 'Mon-Fri 9:00 AM - 5:00 PM' },
  services: [{ type: String }],
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
}, { timestamps: true });

serviceCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ServiceCenter', serviceCenterSchema);