// ── FILE: utils/queueAlgorithm.js ── Shortest-queue routing + token generation
const QueueTicket = require('../models/QueueTicket');

/**
 * Hard-coded doctor roster per department for hackathon demo.
 * In production, this would come from a Doctor model in MongoDB.
 */
const DOCTOR_ROSTER = {
  'Cardiology': ['Dr. Anjali Mehta', 'Dr. Rajesh Kapoor'],
  'Orthopedics': ['Dr. Sunil Verma', 'Dr. Priya Nair'],
  'General Medicine': ['Dr. Aditi Sharma', 'Dr. Vikram Patel', 'Dr. Neha Gupta'],
  'ENT': ['Dr. Rohit Saxena', 'Dr. Meera Iyer'],
  'Dermatology': ['Dr. Kavita Reddy', 'Dr. Arjun Das'],
  'Neurology': ['Dr. Deepak Joshi', 'Dr. Shalini Rao'],
  'Pediatrics': ['Dr. Pooja Malhotra', 'Dr. Amit Kulkarni'],
  'Gynecology': ['Dr. Sunita Deshmukh', 'Dr. Rashmi Pillai'],
  'Ophthalmology': ['Dr. Kiran Bhat', 'Dr. Nandini Srinivasan'],
  'Psychiatry': ['Dr. Anil Menon', 'Dr. Sneha Chatterjee'],
};

// Department code abbreviations for token generation
const DEPT_CODES = {
  'Cardiology': 'CARDIO',
  'Orthopedics': 'ORTHO',
  'General Medicine': 'GENMED',
  'ENT': 'ENT',
  'Dermatology': 'DERMA',
  'Neurology': 'NEURO',
  'Pediatrics': 'PEDIA',
  'Gynecology': 'GYNEC',
  'Ophthalmology': 'OPHTH',
  'Psychiatry': 'PSYCH',
};

/**
 * Find the doctor with the shortest active queue in a department.
 * FAIL-SAFE 3: If no doctors found, defaults to "Dr. On-Call" with queue length 0.
 *
 * @param {string} department - Department name
 * @returns {{ doctorName: string, currentQueueLength: number }}
 */
const findShortestQueue = async (department) => {
  const doctors = DOCTOR_ROSTER[department];

  // Fail-safe: if department not in roster, default to On-Call
  if (!doctors || doctors.length === 0) {
    return { doctorName: 'Dr. On-Call', currentQueueLength: 0 };
  }

  try {
    // Count WAITING tickets per doctor in this department
    const pipeline = await QueueTicket.aggregate([
      {
        $match: {
          department,
          status: 'WAITING',
        },
      },
      {
        $group: {
          _id: '$assignedDoctor',
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a map of doctor → queue count
    const queueMap = {};
    for (const doc of pipeline) {
      queueMap[doc._id] = doc.count;
    }

    // Find the doctor with fewest active tickets (default to 0 if no tickets)
    let bestDoctor = doctors[0];
    let bestCount = queueMap[doctors[0]] || 0;

    for (let i = 1; i < doctors.length; i++) {
      const count = queueMap[doctors[i]] || 0;
      if (count < bestCount) {
        bestDoctor = doctors[i];
        bestCount = count;
      }
    }

    return { doctorName: bestDoctor, currentQueueLength: bestCount };
  } catch (err) {
    // If aggregation fails (e.g., no MongoDB), fall back to first doctor
    console.error('Queue aggregation error:', err.message);
    return { doctorName: doctors[0], currentQueueLength: 0 };
  }
};

/**
 * Generate a human-readable token number like "CARDIO-007".
 * @param {string} department - Department name
 * @param {number} count - Current ticket count + 1
 * @returns {string} Token number
 */
const generateTokenNumber = (department, count) => {
  const code = DEPT_CODES[department] || department.substring(0, 5).toUpperCase();
  const padded = String(count).padStart(3, '0');
  return `${code}-${padded}`;
};

module.exports = {
  findShortestQueue,
  generateTokenNumber,
  DOCTOR_ROSTER,
  DEPT_CODES,
};
