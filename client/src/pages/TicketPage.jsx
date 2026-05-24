// ── FILE: pages/TicketPage.jsx ── Queue ticket display with priority + doctor info
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Printer,
  RotateCcw,
  Clock,
  MapPin,
  UserCheck,
  Hash,
  Activity,
  CheckCircle,
} from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import KioskButton from '../components/KioskButton';
import { usePatient } from '../context/PatientContext';

export default function TicketPage() {
  const navigate = useNavigate();
  const { queueTicket, patientData, triageResult, resetAll } = usePatient();
  const [estimatedWait, setEstimatedWait] = useState(null);

  useEffect(() => {
    if (!queueTicket) {
      navigate('/');
      return;
    }
    setEstimatedWait(queueTicket.estimatedWaitMinutes || 0);
  }, [queueTicket, navigate]);

  // Simulated wait time polling (decreases every 30 seconds)
  useEffect(() => {
    if (!queueTicket) return;

    const interval = setInterval(() => {
      setEstimatedWait((prev) => (prev > 0 ? prev - 1 : 0));
    }, 30000);

    return () => clearInterval(interval);
  }, [queueTicket]);

  const handleNewCheckin = () => {
    resetAll();
    navigate('/');
  };

  const handlePrint = () => {
    alert(
      `🖨️ Printing Ticket...\n\nToken: ${queueTicket?.tokenNumber}\nDepartment: ${queueTicket?.department}\nDoctor: ${queueTicket?.assignedDoctor || queueTicket?.doctorName}\n\n(Print/SMS feature — available in production)`
    );
  };

  if (!queueTicket) return null;

  const priorityMessages = {
    RED: 'You will be seen shortly. Please stay near the department.',
    YELLOW: 'Please wait nearby. A nurse will call your token.',
    GREEN: 'Please take a seat. You will be called in order.',
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border-light bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kiosk-blue to-blue-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading font-bold text-xl text-text-primary">Your Queue Ticket</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <CheckCircle className="w-4 h-4 text-kiosk-green" />
          Check-in Complete
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
          className="w-full max-w-lg"
        >
          {/* Ticket Card */}
          <div className="bg-white rounded-3xl kiosk-shadow border border-border-light overflow-hidden">
            {/* Token Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-8 py-10 text-center relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

              <p className="text-sm text-white/60 uppercase tracking-widest font-semibold mb-4 relative z-10">
                Your Token Number
              </p>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
                className="token-display relative z-10"
              >
                {queueTicket.tokenNumber}
              </motion.div>
            </div>

            {/* Priority Badge */}
            <div className="flex justify-center -mt-5 relative z-10">
              <PriorityBadge tier={queueTicket.priorityTier} size="lg" />
            </div>

            {/* Priority Message */}
            <div className="px-8 pt-6 pb-2 text-center">
              <p className="text-base text-text-secondary font-medium">
                {priorityMessages[queueTicket.priorityTier] || priorityMessages.GREEN}
              </p>
            </div>

            {/* Ticket Details */}
            <div className="px-8 py-6 space-y-4">
              {/* Department */}
              <div className="flex items-center gap-4 bg-bg-primary rounded-xl px-5 py-4">
                <MapPin className="w-5 h-5 text-kiosk-blue flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">
                    Department
                  </p>
                  <p className="font-heading font-bold text-lg text-text-primary">
                    {queueTicket.department}
                  </p>
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-center gap-4 bg-bg-primary rounded-xl px-5 py-4">
                <UserCheck className="w-5 h-5 text-kiosk-green flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">
                    Assigned Doctor
                  </p>
                  <p className="font-heading font-bold text-lg text-text-primary">
                    {queueTicket.assignedDoctor || queueTicket.doctorName || 'Dr. On-Call'}
                  </p>
                </div>
              </div>

              {/* Wait Time + Queue Position */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-bg-primary rounded-xl px-5 py-4">
                  <Clock className="w-5 h-5 text-kiosk-amber flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">
                      Est. Wait
                    </p>
                    <p className="font-heading font-bold text-lg text-text-primary">
                      {estimatedWait} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-bg-primary rounded-xl px-5 py-4">
                  <Hash className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">
                      Position
                    </p>
                    <p className="font-heading font-bold text-lg text-text-primary">
                      #{queueTicket.queuePosition || 1}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Name (if available) */}
              {patientData?.name && (
                <div className="text-center pt-2 border-t border-border-light">
                  <p className="text-sm text-text-muted">Patient</p>
                  <p className="font-semibold text-text-primary">{patientData.name}</p>
                </div>
              )}
            </div>

            {/* Dashed separator */}
            <div className="relative px-4">
              <div className="border-t-2 border-dashed border-border-light" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-bg-primary" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-bg-primary" />
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-6 space-y-3">
              <KioskButton
                label="Print / SMS Ticket"
                icon={<Printer className="w-5 h-5" />}
                onClick={handlePrint}
                variant="primary"
              />
              <KioskButton
                label="Start New Check-in"
                icon={<RotateCcw className="w-5 h-5" />}
                onClick={handleNewCheckin}
                variant="secondary"
              />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
