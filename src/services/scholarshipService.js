const Scholarship = require('../models/Scholarship');

const findMatchingScholarships = async (filters) => {
  const query = { isActive: true };

  if (filters.category && filters.category !== 'All') {
    query['eligibility.category'] = { $in: [filters.category] };
  }
  if (filters.gender && filters.gender !== 'All') {
    query['eligibility.gender'] = { $in: [filters.gender, 'All'] };
  }
  if (filters.maxIncome) {
    query['eligibility.maxFamilyIncome'] = { $gte: parseInt(filters.maxIncome) };
  }
  if (filters.state) {
    query.$or = [
      { 'eligibility.state': { $in: [filters.state] } },
      { 'eligibility.state': { $size: 0 } },
    ];
  }
  if (filters.stream) {
    query['eligibility.stream'] = { $in: [filters.stream] };
  }
  if (filters.degree) {
    query['eligibility.degree'] = { $in: [filters.degree] };
  }

  return await Scholarship.find(query).sort({ amount: -1 });
};

module.exports = { findMatchingScholarships };