// ── FILE: routes/queue.routes.js ── Queue allocation API routes
const express = require('express');
const router = express.Router();
const { validateQueueAllocate, handleValidationErrors } = require('../middleware/validate');
const { allocateQueueController } = require('../controllers/queue.controller');

// POST /api/queue/allocate
// Assign patient to shortest queue → generate token → return ticket
router.post(
  '/allocate',
  validateQueueAllocate,
  handleValidationErrors,
  allocateQueueController
);

module.exports = router;
