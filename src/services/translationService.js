const { getGeminiClient } = require('../config/ai');

const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
};

// Static translations for common UI strings
const STATIC_TRANSLATIONS = {
  en: {
    welcome: 'Welcome to GramSaathi',
    eligibleSchemes: 'Eligible Schemes',
    applyNow: 'Apply Now',
    documents: 'Required Documents',
    deadline: 'Application Deadline',
    benefits: 'Benefits',
  },
  hi: {
    welcome: 'ग्रामसाथी में आपका स्वागत है',
    eligibleSchemes: 'पात्र योजनाएं',
    applyNow: 'अभी आवेदन करें',
    documents: 'आवश्यक दस्तावेज़',
    deadline: 'आवेदन की अंतिम तिथि',
    benefits: 'लाभ',
  },
  te: {
    welcome: 'గ్రామసాధికి స్వాగతం',
    eligibleSchemes: 'అర్హమైన పథకాలు',
    applyNow: 'ఇప్పుడే దరఖాస్తు చేయండి',
    documents: 'అవసరమైన పత్రాలు',
    deadline: 'దరఖాస్తు గడువు',
    benefits: 'ప్రయోజనాలు',
  },
  ta: {
    welcome: 'கிராம்சாதிக்கு வரவேற்கிறோம்',
    eligibleSchemes: 'தகுதியான திட்டங்கள்',
    applyNow: 'இப்போது விண்ணப்பிக்கவும்',
    documents: 'தேவையான ஆவணங்கள்',
    deadline: 'விண்ணப்ப காலக்கெடு',
    benefits: 'நன்மைகள்',
  },
};

const translateWithAI = async (text, targetLanguage) => {
  try {
    const client = getGeminiClient();
    if (!client) return text;

    const langName = SUPPORTED_LANGUAGES[targetLanguage] || 'English';
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Translate to ${langName}. Return ONLY the translation:\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return text;
  }
};

const getStaticTranslation = (key, language = 'en') => {
  return STATIC_TRANSLATIONS[language]?.[key] || STATIC_TRANSLATIONS.en[key] || key;
};

module.exports = { translateWithAI, getStaticTranslation, SUPPORTED_LANGUAGES };