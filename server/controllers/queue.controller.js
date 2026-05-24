// ── FILE: controllers/queue.controller.js ── Queue allocation + ticket generation
const Patient = require('../models/Patient');
const QueueTicket = require('../models/QueueTicket');
const { findShortestQueue, generateTokenNumber } = require('../utils/queueAlgorithm');

// Average consultation time per patient in minutes (configurable)
const AVG_CONSULT_MINUTES = 12;

/**
 * POST /api/queue/allocate
 * Accepts { patientId, department, priorityTier }
 * → finds shortest queue → generates token → saves ticket → returns result.
 */
const allocateQueueController = async (req, res) => {
  try {
    const { patientId, department, priorityTier } = req.body;

    // Verify patient exists (if MongoDB is available)
    try {
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found. Please scan your ID again.',
        });
      }
    } catch (err) {
      // If patient lookup fails (e.g., invalid ObjectId format in demo mode),
      // continue anyway for hackathon resilience
      console.warn('Patient lookup warning:', err.message);
    }

    // Find the doctor with the shortest queue (FAIL-SAFE 3 built-in)
    const { doctorName, currentQueueLength } = await findShortestQueue(department);

    // Count total tickets in this department today (for token numbering)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let totalToday = 0;
    try {
      totalToday = await QueueTicket.countDocuments({
        department,
        checkInAt: { $gte: todayStart },
      });
    } catch {
      // If count fails, use a timestamp-based fallback
      totalToday = Math.floor(Date.now() / 1000) % 999;
    }

    // Generate token number
    const tokenNumber = generateTokenNumber(department, totalToday + 1);

    // Calculate estimated wait time
    const estimatedWaitMinutes = currentQueueLength * AVG_CONSULT_MINUTES;

    // Create and save the queue ticket
    try {
      const ticket = new QueueTicket({
        tokenNumber,
        department,
        status: 'WAITING',
        priorityTier,
        patientId,
        assignedDoctor: doctorName,
        checkInAt: new Date(),
        estimatedWaitMinutes,
      });

      await ticket.save();

      return res.status(201).json({
        success: true,
        ticket: ticket.toObject(),
        estimatedWaitMinutes,
        doctorName,
        queuePosition: currentQueueLength + 1,
      });
    } catch (dbErr) {
      // FAIL-SAFE 4: Database save failure
      console.error('Ticket save error:', dbErr.message);

      // Still return a "virtual" ticket so the kiosk flow doesn't break
      return res.status(200).json({
        success: true,
        ticket: {
          tokenNumber,
          department,
          status: 'WAITING',
          priorityTier,
          assignedDoctor: doctorName,
          checkInAt: new Date(),
          estimatedWaitMinutes,
          _isVirtual: true, // Flag that this wasn't persisted
        },
        estimatedWaitMinutes,
        doctorName,
        queuePosition: currentQueueLength + 1,
        warning: 'Ticket generated but could not be saved to database.',
      });
    }
  } catch (err) {
    console.error('Queue allocation error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Queue allocation failed — please retry.',
    });
  }
};

module.exports = {
  allocateQueueController,
};
