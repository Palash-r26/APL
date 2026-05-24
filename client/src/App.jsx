// ── FILE: App.jsx ── Zero-Wait OPD Kiosk — Root component with routing
import { Routes, Route } from 'react-router-dom';
import { PatientProvider } from './context/PatientContext';
import WelcomePage from './pages/WelcomePage';
import IDScanPage from './pages/IDScanPage';
import SymptomChatPage from './pages/SymptomChatPage';
import TicketPage from './pages/TicketPage';

/**
 * Root application component.
 * Wraps all routes in PatientContext for shared kiosk state.
 */
export default function App() {
  return (
    <PatientProvider>
      <div className="min-h-screen bg-bg-primary font-body overflow-hidden">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/scan" element={<IDScanPage />} />
          <Route path="/symptoms" element={<SymptomChatPage />} />
          <Route path="/ticket" element={<TicketPage />} />
        </Routes>
      </div>
    </PatientProvider>
  );
}
