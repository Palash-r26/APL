// ── FILE: routes/triage.routes.js ── Triage API routes
const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/upload');
const { validateSymptomChat, handleValidationErrors } = require('../middleware/validate');
const { extractIdController, analyzeSymptomController } = require('../controllers/triage.controller');

// POST /api/triage/extract-id
// Upload an ID card image → OCR via Gemini Vision → return patient data
router.post('/extract-id', uploadMiddleware, extractIdController);

// POST /api/triage/analyze-symptoms
// Send conversation history → Gemini triage AI → return assessment
router.post(
  '/analyze-symptoms',
  validateSymptomChat,
  handleValidationErrors,
  analyzeSymptomController
);

module.exports = router;
