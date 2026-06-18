const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  language: { type: String, enum: ['en', 'hi', 'te', 'ta'], default: 'en' },
  audioUrl: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionId: { type: String, required: true, index: true },
  messages: [messageSchema],
  language: { type: String, enum: ['en', 'hi', 'te', 'ta'], default: 'en' },
  title: { type: String, default: 'New Conversation' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);