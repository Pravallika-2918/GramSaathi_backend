const { getGeminiClient } = require('../config/ai');

const detectPlantDisease = async (imageBase64, language = 'en') => {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API not configured');

  const langInstructions = {
    en: 'Respond in English.',
    hi: 'हिंदी में उत्तर दें।',
    te: 'తెలుగులో సమాధానం ఇవ్వండి.',
    ta: 'தமிழில் பதிலளிக்கவும்.',
  };

  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `${langInstructions[language] || langInstructions.en}
Analyze this crop/plant image and provide:
1. Disease Name (if any)
2. Confidence Score (0-100%)
3. Causes of the disease
4. Prevention Methods
5. Severity (Low/Medium/High)
6. Suggested immediate action

Format response as JSON:
{
  "diseaseName": "",
  "confidence": 0,
  "causes": [],
  "prevention": [],
  "severity": "",
  "suggestedAction": "",
  "isHealthy": false
}`;

  const imagePart = {
    inlineData: { data: imageBase64, mimeType: 'image/jpeg' },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const responseText = result.response.text();

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { diseaseName: 'Analysis complete', confidence: 0, causes: [], prevention: [], severity: 'Unknown', suggestedAction: responseText, isHealthy: false };
  } catch {
    return { diseaseName: 'Unable to parse', confidence: 0, causes: [], prevention: [], severity: 'Unknown', suggestedAction: responseText, isHealthy: false };
  }
};

const getFertilizerRecommendation = async (cropType, soilCondition, disease, language = 'en') => {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API not configured');

  const langInstructions = {
    en: 'Respond in English.',
    hi: 'हिंदी में उत्तर दें।',
    te: 'తెలుగులో సమాధానం ఇవ్వండి.',
    ta: 'தமிழில் பதிலளிக்கவும்.',
  };

  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `${langInstructions[language] || langInstructions.en}
Recommend fertilizers and pesticides for:
- Crop: ${cropType}
- Soil Condition: ${soilCondition}
- Disease: ${disease || 'None detected'}

Return JSON:
{
  "fertilizers": [{"name":"","usage":"","frequency":"","quantity":""}],
  "pesticides": [{"name":"","usage":"","safetyTips":""}],
  "organicAlternatives": [{"name":"","usage":""}],
  "generalTips": []
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { fertilizers: [], pesticides: [], organicAlternatives: [], generalTips: [text] };
  } catch {
    return { fertilizers: [], pesticides: [], organicAlternatives: [], generalTips: [text] };
  }
};

module.exports = { detectPlantDisease, getFertilizerRecommendation };