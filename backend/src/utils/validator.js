import { body, validationResult } from 'express-validator';

/* ------------------------
   Registration Validator
------------------------- */
export const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),

  body('full_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must be less than 100 characters')
];

/* ------------------------
   Login Validator
------------------------- */
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/* ------------------------
   Journal Validator
------------------------- */
export const validateJournal = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Journal content is required')
    .isLength({ max: 5000 })
    .withMessage('Journal content must be less than 5000 characters'),

  body('is_voice')
    .optional()
    .isBoolean()
    .withMessage('is_voice must be a boolean')
];

/* ------------------------
   Community Post Validator
------------------------- */
export const validateCommunityPost = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ max: 1000 })
    .withMessage('Post content must be less than 1000 characters'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Post title must be less than 100 characters'),

  body('category')
    .optional()
    .trim()
    .isIn(['General', 'Advice', 'Vent', 'Fun'])
    .withMessage('Invalid category'),

  body('is_anonymous')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('is_anonymous must be a boolean')
];

/* ------------------------
   Validation Result Handler
------------------------- */
export const checkValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }

  next();
};
