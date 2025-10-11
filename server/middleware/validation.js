const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['school', 'donor', 'ngo', 'college'])
    .withMessage('Role must be one of: school, donor, ngo, college'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// School profile validation
const validateSchoolProfile = [
  body('schoolName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('School name must be at least 2 characters'),
  body('registrationNumber')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.pincode')
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),
  body('contactPerson')
    .trim()
    .notEmpty()
    .withMessage('Contact person is required'),
  body('phone')
    .matches(/^\d{10}$/)
    .withMessage('Phone must be 10 digits'),
  body('principalName')
    .trim()
    .notEmpty()
    .withMessage('Principal name is required'),
  handleValidationErrors
];

// Student profile validation
const validateStudentProfile = [
  body('studentName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Student name must be at least 2 characters'),
  body('grade')
    .trim()
    .notEmpty()
    .withMessage('Grade is required'),
  body('category')
    .isIn(['academic', 'sports', 'extracurricular'])
    .withMessage('Category must be academic, sports, or extracurricular'),
  body('achievementDetails')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Achievement details must be at least 10 characters'),
  body('financialNeed')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Financial need must be a positive number'),
  handleValidationErrors
];

// Request validation
const validateRequest = [
  body('requestType')
    .isIn(['infrastructure', 'student', 'equipment'])
    .withMessage('Request type must be infrastructure, student, or equipment'),
  body('title')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters'),
  body('description')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  body('amountNeeded')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Amount needed must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  handleValidationErrors
];

// College profile validation
const validateCollegeProfile = [
  body('collegeName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('College name must be at least 2 characters'),
  body('affiliationNumber')
    .trim()
    .notEmpty()
    .withMessage('Affiliation number is required'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.pincode')
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),
  body('contactPerson')
    .trim()
    .notEmpty()
    .withMessage('Contact person is required'),
  body('phone')
    .matches(/^\d{10}$/)
    .withMessage('Phone must be 10 digits'),
  handleValidationErrors
];

// Donation validation
const validateDonation = [
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Donation amount must be a positive number'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateSchoolProfile,
  validateStudentProfile,
  validateRequest,
  validateCollegeProfile,
  validateDonation,
  handleValidationErrors
};