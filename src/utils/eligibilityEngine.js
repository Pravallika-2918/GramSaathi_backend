const checkEligibility = (user, scheme) => {
  const reasons = [];
  const eligibility = scheme.eligibility || {};

  // Normalize income - handle both 'income' and 'annualIncome' field names
  const userIncome = user.annualIncome ?? user.income ?? 0;
  const userAge = user.age ?? 0;
  const userGender = user.gender ?? '';
  const userOccupation = user.occupation ?? '';
  const userCategory = user.category ?? '';
  const userState = user.state ?? '';

  // Age check
  if (eligibility.minAge && userAge < eligibility.minAge) {
    reasons.push(`Minimum age required: ${eligibility.minAge}`);
  }
  if (eligibility.maxAge && eligibility.maxAge < 150 && userAge > eligibility.maxAge) {
    reasons.push(`Maximum age allowed: ${eligibility.maxAge}`);
  }

  // Gender check
  if (eligibility.gender && eligibility.gender !== 'All' && eligibility.gender !== userGender) {
    reasons.push(`Only for ${eligibility.gender}`);
  }

  // Income check
  if (eligibility.maxIncome && eligibility.maxIncome < 99999999 && userIncome > eligibility.maxIncome) {
    reasons.push(`Annual income must be below ₹${eligibility.maxIncome.toLocaleString('en-IN')}`);
  }

  // Occupation check
  if (eligibility.occupation?.length > 0 && !eligibility.occupation.includes(userOccupation)) {
    reasons.push(`Occupation must be one of: ${eligibility.occupation.join(', ')}`);
  }

  // Category check
  if (eligibility.category?.length > 0 && userCategory && !eligibility.category.includes(userCategory)) {
    reasons.push(`Category must be one of: ${eligibility.category.join(', ')}`);
  }

  // State check
  if (
    eligibility.state?.length > 0 &&
    !eligibility.state.includes(userState) &&
    !eligibility.state.includes('All')
  ) {
    reasons.push(`Available only in: ${eligibility.state.join(', ')}`);
  }

  const isEligible = reasons.length === 0;
  return { isEligible, reasons };
};

const getEligibleSchemes = (user, schemes) => {
  return schemes
    .map((scheme) => {
      const { isEligible, reasons } = checkEligibility(user, scheme);
      return { ...scheme.toObject(), isEligible, ineligibilityReasons: reasons };
    })
    .sort((a, b) => (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0));
};

module.exports = { checkEligibility, getEligibleSchemes };