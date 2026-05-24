// ── FILE: context/PatientContext.jsx ── Global state for patient kiosk flow
import { createContext, useContext, useState, useCallback } from 'react';

const PatientContext = createContext(null);

/**
 * Global state provider for the kiosk check-in flow.
 * Stores patient data, triage result, and queue ticket across pages.
 */
export function PatientProvider({ children }) {
  const [patientData, setPatientData] = useState(null);
  const [triageResult, setTriageResult] = useState(null);
  const [queueTicket, setQueueTicket] = useState(null);

  // Reset all state for a new check-in session
  const resetAll = useCallback(() => {
    setPatientData(null);
    setTriageResult(null);
    setQueueTicket(null);
  }, []);

  return (
    <PatientContext.Provider
      value={{
        patientData,
        setPatientData,
        triageResult,
        setTriageResult,
        queueTicket,
        setQueueTicket,
        resetAll,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

/**
 * Hook to access patient context.
 * Must be used within a PatientProvider.
 */
export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return ctx;
}
