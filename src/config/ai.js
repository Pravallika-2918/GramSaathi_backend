const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

let geminiClient = null;
let openaiClient = null;

const getGeminiClient = () => {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

const getOpenAIClient = () => {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

module.exports = { getGeminiClient, getOpenAIClient };