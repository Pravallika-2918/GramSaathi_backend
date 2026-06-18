const { getGeminiClient } = require('../config/ai');

const LANGUAGE_PROMPTS = {
  en: 'Respond in clear English.',
  hi: 'हिंदी में उत्तर दें।',
  te: 'తెలుగులో సమాధానం ఇవ్వండి.',
  ta: 'தமிழில் பதிலளிக்கவும்.',
};

const SYSTEM_PROMPT = `You are GramSaathi AI Assistant, a helpful rural assistance chatbot for India.
You help rural citizens with:
- Government schemes and eligibility criteria
- Scholarship information for students
- Healthcare guidance and government health schemes
- Agricultural support, subsidies and farmer welfare programs
- Document requirements for applications
- Step by step application procedures

Always be helpful, empathetic, and provide accurate information about Indian government schemes.
Keep responses concise and easy to understand. Use simple language suitable for rural citizens.
When listing schemes or options, use numbered lists for clarity.`;

const chatWithGemini = async (messages, language = 'en', userProfile = null) => {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini client not initialized. Check GEMINI_API_KEY.');

  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const languageInstruction = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en;

  const profileContext = userProfile
    ? `\nUser Profile Context:
- Name: ${userProfile.name}
- Age: ${userProfile.age}, Gender: ${userProfile.gender}
- Occupation: ${userProfile.occupation}
- Annual Income: ₹${userProfile.annualIncome ?? userProfile.income ?? 'Unknown'}
- Location: ${userProfile.district}, ${userProfile.state}
- Category: ${userProfile.category || 'General'}`
    : '';

  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nLanguage Instruction: ${languageInstruction}${profileContext}`;

  // Build history excluding the last message
  const historyMessages = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  const history = [
    {
      role: 'user',
      parts: [{ text: fullSystemPrompt }],
    },
    {
      role: 'model',
      parts: [{ text: 'Understood. I am GramSaathi AI Assistant, ready to help rural citizens of India with government schemes, scholarships, healthcare, and agricultural support.' }],
    },
    ...historyMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
  ];

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  });

  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;

  if (!response) throw new Error('Empty response from Gemini');

  return response.text();
};

const translateText = async (text, targetLanguage) => {
  try {
    const client = getGeminiClient();
    if (!client) return text;

    const languageNames = { en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil' };
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Translate the following text to ${languageNames[targetLanguage] || 'English'}. 
Return ONLY the translated text with no extra explanation or formatting:

${text}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Translation error:', error.message);
    return text;
  }
};

const analyzeSchemeEligibility = async (userProfile, schemes, language = 'en') => {
  try {
    const client = getGeminiClient();
    if (!client) throw new Error('Gemini API not configured');

    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const langInstruction = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en;

    const schemeList = schemes.slice(0, 5)
      .map((s, i) => `${i + 1}. ${s.schemeName}: ${s.description}`)
      .join('\n');

    const prompt = `${langInstruction}

Based on this user profile:
- Age: ${userProfile.age}, Gender: ${userProfile.gender}
- Occupation: ${userProfile.occupation}
- Annual Income: ₹${userProfile.annualIncome ?? userProfile.income}
- State: ${userProfile.state}
- Category: ${userProfile.category || 'General'}

Briefly explain (2-3 lines each) why this person is eligible for these schemes:
${schemeList}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Scheme analysis error:', error.message);
    return '';
  }
};

module.exports = { chatWithGemini, translateText, analyzeSchemeEligibility };