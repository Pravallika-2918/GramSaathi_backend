const Scheme = require('../models/Scheme');
const Scholarship = require('../models/Scholarship');
const AgricultureScheme = require('../models/AgricultureScheme');
const { checkEligibility } = require('../utils/eligibilityEngine');

const getPersonalizedRecommendations = async (user) => {
  try {
    // Normalize income field from old documents
    const normalizedUser = {
      ...user.toObject ? user.toObject() : user,
      annualIncome: user.annualIncome ?? user.income ?? 0,
    };

    const [schemes, scholarships, agriSchemes] = await Promise.all([
      Scheme.find({ isActive: true }),
      Scholarship.find({ isActive: true }),
      AgricultureScheme.find({ isActive: true }),
    ]);

    // Eligible schemes
    const eligibleSchemes = schemes
      .map((s) => ({ ...s.toObject(), ...checkEligibility(normalizedUser, s) }))
      .filter((s) => s.isEligible)
      .slice(0, 10);

    // Eligible scholarships
    const eligibleScholarships = normalizedUser.occupation === 'Student'
      ? scholarships.filter((sc) => {
          const e = sc.eligibility;
          if (e.maxFamilyIncome && normalizedUser.annualIncome > e.maxFamilyIncome) return false;
          if (e.category?.length && normalizedUser.category && !e.category.includes(normalizedUser.category)) return false;
          if (e.gender && e.gender !== 'All' && e.gender !== normalizedUser.gender) return false;
          if (e.state?.length && !e.state.includes(normalizedUser.state)) return false;
          return true;
        }).slice(0, 5)
      : [];

    // Eligible agriculture schemes
    const eligibleAgriSchemes = normalizedUser.occupation === 'Farmer'
      ? agriSchemes.filter((a) => {
          const e = a.eligibility;
          if (e.maxIncome && normalizedUser.annualIncome > e.maxIncome) return false;
          if (e.state?.length && !e.state.includes(normalizedUser.state) && !e.state.includes('All')) return false;
          return true;
        }).slice(0, 5)
      : [];

    return { eligibleSchemes, eligibleScholarships, eligibleAgriSchemes };
  } catch (error) {
    console.error('Recommendation error:', error);
    return { eligibleSchemes: [], eligibleScholarships: [], eligibleAgriSchemes: [] };
  }
};

module.exports = { getPersonalizedRecommendations };