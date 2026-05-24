// ── FILE: api/client.js ── Axios instance + API functions
import axios from 'axios';

// Base Axios instance pointing to the Express backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Upload an ID card image for OCR extraction.
 * @param {FormData} formData - FormData with 'idImage' field
 * @returns {Promise} API response with patient data
 */
export const extractPatientId = async (formData) => {
  const res = await api.post('/api/triage/extract-id', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

/**
 * Send symptom conversation to Gemini for triage analysis.
 * @param {Array} messages - [{role: 'user'|'model', content: string}]
 * @returns {Promise} Triage result with department, priority, reasoning
 */
export const analyzeSymptoms = async (messages) => {
  const res = await api.post('/api/triage/analyze-symptoms', { messages });
  return res.data;
};

/**
 * Allocate a queue ticket for the patient.
 * @param {{ patientId: string, department: string, priorityTier: string }} payload
 * @returns {Promise} Queue ticket with token, doctor, wait time
 */
export const allocateQueue = async (payload) => {
  const res = await api.post('/api/queue/allocate', payload);
  return res.data;
};

export default api;
