const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [1, 'Age must be at least 1'],
    max: [120, 'Age cannot exceed 120'],
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other'],
  },
  occupation: {
    type: String,
    required: [true, 'Occupation is required'],
    enum: ['Farmer', 'Student', 'Self-Employed', 'Salaried', 'Unemployed', 'Other'],
  },
  annualIncome: {
    type: Number,
    required: [true, 'Annual income is required'],
    min: [0, 'Annual income cannot be negative'],
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Widowed', 'Divorced', ''],
    default: '',
  },
  category: {
    type: String,
    enum: ['General', 'OBC', 'SC', 'ST', ''],
    default: '',
  },
  caste: { type: String, default: '' },
  educationLevel: {
    type: String,
    enum: ['Illiterate', 'Primary', 'Secondary', 'Higher Secondary', 'Graduate', 'Post Graduate', ''],
    default: '',
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'hi', 'te', 'ta'],
    default: 'en',
  },
  savedSchemes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scheme' }],
  savedScholarships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' }],
  recentSearches: [{ type: String }],
  profilePhoto: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  emailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
}, {
  timestamps: true,
  // This handles old documents that may have 'income' field
  strict: false,
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

// Clean JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  // Normalize income field - if old doc has 'income', map to annualIncome
  if (obj.income !== undefined && obj.annualIncome === undefined) {
    obj.annualIncome = obj.income;
  }
  delete obj.income;
  return obj;
};

module.exports = mongoose.model('User', userSchema);