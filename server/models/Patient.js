// ── FILE: models/Patient.js ── Patient demographics + insurance info
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    // Core demographics
    name: { type: String, trim: true },
    dob: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'unknown'],
      default: 'unknown',
    },
    // Government-issued ID (Aadhar, Passport, etc.)
    uniqueId: { type: String, index: true, trim: true },

    // Insurance details (embedded subdocument)
    insurance: {
      provider: { type: String, trim: true },
      policyId: { type: String, trim: true },
      status: {
        type: String,
        enum: ['active', 'inactive', 'unknown'],
        default: 'unknown',
      },
    },

    // OCR confidence tracking
    isPartial: { type: Boolean, default: false }, // true when OCR only partially succeeded
    rawOcrText: { type: String }, // raw Gemini output for audit trail
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Patient', patientSchema);
