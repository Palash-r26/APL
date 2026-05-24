// ── FILE: middleware/validate.js ── express-validator chains for request validation
const { body, validationResult } = require('express-validator');

/**
 * Validation chain for POST /api/triage/analyze-symptoms
 * Ensures messages array is present and non-empty.
 */
const validateSymptomChat = [
  body('messages')
    .isArray({ min: 1 })
    .withMessage('messages must be a non-empty array'),
  body('messages.*.role')
    .isIn(['user', 'model'])
    .withMessage('Each message role must be "user" or "model"'),
  body('messages.*.content')
    .isString()
    .notEmpty()
    .withMessage('Each message must have non-empty content'),
];

/**
 * Validation chain for POST /api/queue/allocate
 * Ensures patientId, department, and priorityTier are valid.
 */
const validateQueueAllocate = [
  body('patientId')
    .isString()
    .notEmpty()
    .withMessage('patientId is required'),
  body('department')
    .isString()
    .notEmpty()
    .withMessage('department is required'),
  body('priorityTier')
    .isIn(['RED', 'YELLOW', 'GREEN'])
    .withMessage('priorityTier must be RED, YELLOW, or GREEN'),
];

/**
 * Middleware that checks for validation errors and returns 422 if any.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = {
  validateSymptomChat,
  validateQueueAllocate,
  handleValidationErrors,
};
