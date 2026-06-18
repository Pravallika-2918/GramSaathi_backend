const { getOpenAIClient } = require('../config/ai');

const LANGUAGE_PROMPTS = {
  en: 'Respond in English.',
  hi: 'हिंदी में उत्तर दें।',
  te: 'తెలుగులో సమాధానం ఇవ్వండి.',
  ta: 'தமிழில் பதிலளிக்கவும்.',
};

const SYSTEM_PROMPT = `You are GramSaathi AI Assistant, a helpful rural assistance chatbot for India.
You help rural citizens with government schemes, scholarships, healthcare, agriculture subsidies, and welfare programs.
Be helpful, empathetic, and provide accurate information. Keep responses concise for rural citizens.`;

const chatWithOpenAI = async (messages, language = 'en', userProfile = null) => {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI API not configured');

  const languageInstruction = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en;
  const profileContext = userProfile
    ? `User context: ${userProfile.state}, ${userProfile.occupation}, income ₹${userProfile.annualIncome}/yr.`
    : '';

  const systemMessage = `${SYSTEM_PROMPT} ${languageInstruction} ${profileContext}`;

  const formattedMessages = [
    { role: 'system', content: systemMessage },
    ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: formattedMessages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

module.exports = { chatWithOpenAI };