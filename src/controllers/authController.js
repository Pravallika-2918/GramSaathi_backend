const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');
const nodemailer = require('nodemailer');

// Email transporter
const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'GramSaathi'}" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: '🌾 Welcome to GramSaathi - Your Rural Assistance Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
          <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#1a6b3c,#2ecc71);padding:40px 30px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:28px;">🌾 GramSaathi</h1>
              <p style="color:#d4edda;margin:8px 0 0;font-size:14px;">Connecting Rural Citizens with Opportunities</p>
            </div>
            <div style="padding:30px;">
              <h2 style="color:#1a6b3c;">Welcome, ${user.name}! 🎉</h2>
              <p style="color:#555;line-height:1.6;">Your account has been successfully created. You can now access:</p>
              <ul style="color:#555;line-height:2;">
                <li>✅ Smart Eligibility Checker for government schemes</li>
                <li>🤖 AI Chatbot in Telugu, Hindi, Tamil & English</li>
                <li>📚 Scholarship Finder</li>
                <li>🌾 Agriculture Support & Plant Disease Detector</li>
                <li>📍 Nearby Service Centers via Map</li>
                <li>📄 Document Checklist Generator</li>
              </ul>
              <div style="background:#f8f9fa;border-radius:8px;padding:15px;margin:20px 0;">
                <p style="margin:0;color:#666;font-size:14px;"><strong>Account Details:</strong></p>
                <p style="margin:5px 0;color:#666;font-size:14px;">📧 Email: ${user.email}</p>
                <p style="margin:5px 0;color:#666;font-size:14px;">📱 Mobile: ${user.mobile}</p>
                <p style="margin:5px 0;color:#666;font-size:14px;">📍 Location: ${user.district}, ${user.state}</p>
              </div>
              <div style="text-align:center;margin:25px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="background:linear-gradient(135deg,#1a6b3c,#2ecc71);color:white;padding:12px 30px;border-radius:25px;text-decoration:none;font-size:16px;font-weight:bold;">
                  Login to GramSaathi →
                </a>
              </div>
            </div>
            <div style="background:#f8f9fa;padding:20px;text-align:center;">
              <p style="color:#999;font-size:12px;margin:0;">© 2024 GramSaathi. All rights reserved.</p>
              <p style="color:#999;font-size:11px;margin:5px 0 0;">Empowering Rural India 🇮🇳</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Welcome email error:', error.message);
    // Don't throw - email failure shouldn't break registration
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      name, age, gender, occupation, annualIncome,
      state, district, mobile, email, password,
      maritalStatus, category, caste, educationLevel, preferredLanguage,
    } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered.' : 'Mobile number already registered.',
      });
    }

    const user = await User.create({
      name, age, gender, occupation, annualIncome,
      state, district, mobile, email, password,
      maritalStatus: maritalStatus || '',
      category: category || '',
      caste: caste || '',
      educationLevel: educationLevel || '',
      preferredLanguage: preferredLanguage || 'en',
    });

    // Send welcome email (async, non-blocking)
    sendWelcomeEmail(user);

    sendTokenResponse(user, 201, res, 'Registration successful! Welcome to GramSaathi.');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, mobile, password } = req.body;

    if (!password || (!email && !mobile)) {
      return res.status(400).json({ success: false, message: 'Please provide email/mobile and password.' });
    }

    const query = email ? { email: email.toLowerCase() } : { mobile };
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Login successful!');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('savedSchemes', 'schemeName category benefits')
    .populate('savedScholarships', 'name amount deadline');

  res.status(200).json({ success: true, user });
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password updated successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, updatePassword };