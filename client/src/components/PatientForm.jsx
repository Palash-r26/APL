// ── FILE: components/PatientForm.jsx ── Editable patient details form
import { useState } from 'react';
import { motion } from 'framer-motion';
import KioskButton from './KioskButton';

/**
 * Large, touch-friendly form for patient demographic data.
 * Used when OCR partially succeeds and fields need manual correction.
 *
 * @param {object} initialValues - Pre-filled patient data from OCR
 * @param {Function} onSubmit - Callback with form data
 */
export default function PatientForm({ initialValues = {}, onSubmit }) {
  const [form, setForm] = useState({
    name: initialValues.name || '',
    dob: initialValues.dob || '',
    gender: initialValues.gender || 'unknown',
    uniqueId: initialValues.uniqueId || '',
    insuranceProvider: initialValues.insurance?.provider || '',
    insurancePolicyId: initialValues.insurance?.policyId || '',
    insuranceStatus: initialValues.insurance?.status || 'unknown',
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      dob: form.dob,
      gender: form.gender,
      uniqueId: form.uniqueId,
      insurance: {
        provider: form.insuranceProvider,
        policyId: form.insurancePolicyId,
        status: form.insuranceStatus,
      },
    });
  };

  const inputClasses =
    'w-full bg-white border-2 border-border-light rounded-xl px-5 py-4 text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-kiosk-blue focus:ring-2 focus:ring-kiosk-blue/20 transition-all';
  const labelClasses = 'block text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wide';

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Name */}
      <div>
        <label className={labelClasses}>Full Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter your full name"
          className={inputClasses}
          required
        />
      </div>

      {/* Date of Birth + Gender Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Date of Birth</label>
          <input
            type="date"
            value={form.dob}
            onChange={(e) => handleChange('dob', e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Gender</label>
          <div className="flex gap-2 mt-1">
            {['male', 'female', 'other'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleChange('gender', g)}
                className={`flex-1 py-4 rounded-xl text-base font-semibold capitalize transition-all border-2 ${
                  form.gender === g
                    ? 'bg-kiosk-blue text-white border-kiosk-blue'
                    : 'bg-white text-text-secondary border-border-light hover:border-kiosk-blue/30'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ID Number */}
      <div>
        <label className={labelClasses}>Government ID Number</label>
        <input
          type="text"
          value={form.uniqueId}
          onChange={(e) => handleChange('uniqueId', e.target.value)}
          placeholder="Aadhar / Passport / Driving License"
          className={inputClasses}
        />
      </div>

      {/* Insurance Section */}
      <div className="bg-bg-primary rounded-xl p-5 space-y-4">
        <p className="text-sm font-bold text-text-secondary uppercase tracking-wide">
          Insurance Details <span className="text-text-muted font-normal">(Optional)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Provider</label>
            <input
              type="text"
              value={form.insuranceProvider}
              onChange={(e) => handleChange('insuranceProvider', e.target.value)}
              placeholder="Insurance company"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Policy ID</label>
            <input
              type="text"
              value={form.insurancePolicyId}
              onChange={(e) => handleChange('insurancePolicyId', e.target.value)}
              placeholder="Policy number"
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <KioskButton label="Continue to Symptom Assessment" variant="primary" />
      </div>
    </motion.form>
  );
}
