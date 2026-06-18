const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('occupation').isIn(['Farmer', 'Student', 'Self-Employed', 'Salaried', 'Unemployed', 'Other']).withMessage('Invalid occupation'),
  body('annualIncome').isNumeric().withMessage('Annual income must be a number').isFloat({ min: 0 }),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Invalid mobile number'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const validateLogin = [
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('mobile').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid mobile'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const validateScheme = [
  body('schemeName').trim().notEmpty().withMessage('Scheme name is required'),
  body('category').isIn(['Agriculture', 'Education', 'Healthcare', 'Housing', 'Employment',
    'Women & Child', 'Social Welfare', 'Financial', 'Rural Development', 'Other'])
    .withMessage('Invalid category'),
  handleValidationErrors,
];

const validateScholarship = [
  body('name').trim().notEmpty().withMessage('Scholarship name is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateScheme,
  validateScholarship,
  handleValidationErrors,
};