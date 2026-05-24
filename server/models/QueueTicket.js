// ── FILE: models/QueueTicket.js ── Token + Priority + Doctor assignment
const mongoose = require('mongoose');

const queueTicketSchema = new mongoose.Schema(
  {
    // Token like "CARDIO-004", "ORTHO-012"
    tokenNumber: { type: String, unique: true, required: true },

    // Department the patient is routed to
    department: { type: String, required: true, trim: true },

    // Queue lifecycle status
    status: {
      type: String,
      enum: ['WAITING', 'IN_CONSULTATION', 'DONE'],
      default: 'WAITING',
    },

    // Triage priority — RED is emergency, GREEN is routine
    priorityTier: {
      type: String,
      enum: ['RED', 'YELLOW', 'GREEN'],
      required: true,
    },

    // Reference to the patient document
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },

    // Assigned doctor (string for hackathon; could be ObjectId ref to Doctor model)
    assignedDoctor: { type: String, default: 'Dr. On-Call' },

    // Timestamps for queue analytics
    checkInAt: { type: Date, default: Date.now },
    estimatedWaitMinutes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QueueTicket', queueTicketSchema);
