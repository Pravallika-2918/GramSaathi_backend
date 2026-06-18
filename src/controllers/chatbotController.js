const ChatHistory = require('../models/ChatHistory');
const { chatWithGemini } = require('../services/geminiService');
const { chatWithOpenAI } = require('../services/openaiService');

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const SUGGESTED_QUESTIONS = {
  en: [
    'What schemes am I eligible for?',
    'How to apply for PM Kisan Samman Nidhi?',
    'What documents do I need for Ayushman Bharat?',
    'What scholarships are available for SC/ST students?',
    'How to get crop insurance under PMFBY?',
    'What is Pradhan Mantri Awas Yojana?',
    'How to apply for Mudra loan?',
  ],
  hi: [
    'मैं किन योजनाओं के लिए पात्र हूं?',
    'पीएम किसान सम्मान निधि के लिए कैसे आवेदन करें?',
    'आयुष्मान भारत के लिए कौन से दस्तावेज़ चाहिए?',
    'एससी/एसटी छात्रों के लिए कौन सी छात्रवृत्ति उपलब्ध है?',
    'पीएमएफबीवाई के तहत फसल बीमा कैसे प्राप्त करें?',
    'प्रधानमंत्री आवास योजना क्या है?',
    'मुद्रा लोन के लिए कैसे आवेदन करें?',
  ],
  te: [
    'నేను ఏ పథకాలకు అర్హుడిని?',
    'పీఎం కిసాన్ సమ్మాన్ నిధికి ఎలా దరఖాస్తు చేయాలి?',
    'ఆయుష్మాన్ భారత్ కోసం ఏ పత్రాలు కావాలి?',
    'ఎస్సీ/ఎస్టీ విద్యార్థులకు ఏ స్కాలర్‌షిప్‌లు ఉన్నాయి?',
    'పీఎంఎఫ్‌బీవై కింద పంట బీమా ఎలా పొందాలి?',
    'ప్రధాన మంత్రి ఆవాస్ యోజన అంటే ఏమిటి?',
    'ముద్రా లోన్ కోసం ఎలా దరఖాస్తు చేయాలి?',
  ],
  ta: [
    'நான் எந்த திட்டங்களுக்கு தகுதியானவன்?',
    'PM கிசான் சம்மான் நிதிக்கு விண்ணப்பிப்பது எப்படி?',
    'ஆயுஷ்மான் பாரத்திற்கு என்ன ஆவணங்கள் தேவை?',
    'SC/ST மாணவர்களுக்கு என்ன உதவித்தொகைகள் உள்ளன?',
    'PMFBY கீழ் பயிர் காப்பீடு எப்படி பெறுவது?',
    'பிரதான மந்திரி ஆவாஸ் யோஜனா என்றால் என்ன?',
    'முத்ரா கடன் விண்ணப்பிப்பது எப்படி?',
  ],
};

const getDefaultResponse = (language) => {
  const responses = {
    en: 'I am GramSaathi AI Assistant. I can help you find government schemes, scholarships, and agricultural support programs. Please ask me a specific question!',
    hi: 'मैं ग्रामसाथी AI असिस्टेंट हूं। मैं आपको सरकारी योजनाओं, छात्रवृत्तियों और कृषि सहायता कार्यक्रमों को खोजने में मदद कर सकता हूं।',
    te: 'నేను గ్రామసాధి AI అసిస్టెంట్. నేను మీకు ప్రభుత్వ పథకాలు, స్కాలర్‌షిప్‌లు మరియు వ్యవసాయ సహాయ కార్యక్రమాలు కనుగొనడంలో సహాయపడగలను.',
    ta: 'நான் கிராம்சாதி AI உதவியாளர். நான் உங்களுக்கு அரசு திட்டங்கள், உதவித்தொகைகள் மற்றும் விவசாய ஆதரவு திட்டங்களை கண்டுபிடிக்க உதவலாம்.',
  };
  return responses[language] || responses.en;
};

// @desc    Send message to AI chatbot
// @route   POST /api/chatbot/message
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId, language = 'en' } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const currentSessionId = sessionId || generateSessionId();

    // Find or create session
    let session = await ChatHistory.findOne({
      userId: req.user.id,
      sessionId: currentSessionId,
    });

    if (!session) {
      session = await ChatHistory.create({
        userId: req.user.id,
        sessionId: currentSessionId,
        language,
        messages: [],
        title: message.substring(0, 60),
      });
    }

    // Add user message to DB
    session.messages.push({ role: 'user', content: message.trim(), language });
    await session.save();

    // Prepare message history for AI
    const messageHistory = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Try Gemini first, then OpenAI, then default
    let aiResponse;
    let aiProvider = 'default';

    try {
      aiResponse = await chatWithGemini(messageHistory, language, req.user);
      aiProvider = 'gemini';
    } catch (geminiError) {
      console.warn('⚠️  Gemini failed:', geminiError.message);
      try {
        aiResponse = await chatWithOpenAI(messageHistory, language, req.user);
        aiProvider = 'openai';
      } catch (openaiError) {
        console.warn('⚠️  OpenAI also failed:', openaiError.message);
        aiResponse = getDefaultResponse(language);
        aiProvider = 'default';
      }
    }

    // Add assistant response to DB
    session.messages.push({ role: 'assistant', content: aiResponse, language });
    await session.save();

    res.status(200).json({
      success: true,
      response: aiResponse,
      sessionId: session.sessionId,
      messageCount: session.messages.length,
      provider: aiProvider,
    });
  } catch (error) { next(error); }
};

// @desc    Get all chat sessions
// @route   GET /api/chatbot/history
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user.id, isActive: true })
      .select('sessionId title language createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (error) { next(error); }
};

// @desc    Get specific chat session with messages
// @route   GET /api/chatbot/history/:sessionId
// @access  Private
const getChatSession = async (req, res, next) => {
  try {
    const session = await ChatHistory.findOne({
      userId: req.user.id,
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found.' });
    }

    res.status(200).json({ success: true, session });
  } catch (error) { next(error); }
};

// @desc    Delete chat session
// @route   DELETE /api/chatbot/history/:sessionId
// @access  Private
const deleteChatSession = async (req, res, next) => {
  try {
    await ChatHistory.findOneAndUpdate(
      { userId: req.user.id, sessionId: req.params.sessionId },
      { isActive: false }
    );
    res.status(200).json({ success: true, message: 'Chat session deleted.' });
  } catch (error) { next(error); }
};

// @desc    Get suggested questions
// @route   GET /api/chatbot/suggestions
// @access  Private
const getSuggestedQuestions = async (req, res) => {
  const { language = 'en' } = req.query;
  const questions = SUGGESTED_QUESTIONS[language] || SUGGESTED_QUESTIONS.en;
  res.status(200).json({ success: true, language, questions });
};

module.exports = {
  sendMessage,
  getChatHistory,
  getChatSession,
  deleteChatSession,
  getSuggestedQuestions,
};