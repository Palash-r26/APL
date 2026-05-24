// ── FILE: pages/WelcomePage.jsx ── Kiosk welcome screen with check-in options
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, PenLine, Activity, Globe, Shield } from 'lucide-react';
import KioskButton from '../components/KioskButton';
import { usePatient } from '../context/PatientContext';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { resetAll } = usePatient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedLang, setSelectedLang] = useState('EN');

  // Reset patient data on welcome page (fresh session)
  useEffect(() => {
    resetAll();
  }, [resetAll]);

  // Live clock — update every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const languages = [
    { code: 'EN', label: 'English' },
    { code: 'HI', label: 'हिंदी' },
    { code: 'TA', label: 'தமிழ்' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="gradient-mesh" />

      {/* Header Bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-8 py-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-kiosk-blue to-blue-600 flex items-center justify-center shadow-lg shadow-kiosk-blue/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-text-primary">Zero-Wait</h2>
            <p className="text-xs text-text-muted">Smart OPD Kiosk</p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-text-muted" />
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedLang === lang.code
                  ? 'bg-kiosk-blue text-white'
                  : 'bg-white/70 text-text-secondary hover:bg-white'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Hospital Icon Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-kiosk-blue to-blue-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-kiosk-blue/30"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="font-heading font-extrabold text-5xl md:text-6xl text-text-primary mb-4 leading-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-kiosk-blue to-blue-600 bg-clip-text text-transparent">
              Zero-Wait
            </span>{' '}
            OPD
          </h1>

          <p className="text-xl text-text-secondary mb-12 max-w-lg mx-auto leading-relaxed">
            Skip the queue. Get AI-powered triage and instant doctor assignment in under 2 minutes.
          </p>

          {/* Check-in Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <KioskButton
                label="I Have an ID Card"
                icon={<CreditCard className="w-7 h-7" />}
                onClick={() => navigate('/scan')}
                variant="primary"
                className="min-h-[120px] text-xl"
              />
              <p className="text-sm text-text-muted mt-3">Scan to auto-fill your details</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <KioskButton
                label="Enter Manually"
                icon={<PenLine className="w-7 h-7" />}
                onClick={() => navigate('/symptoms')}
                variant="secondary"
                className="min-h-[120px] text-xl"
              />
              <p className="text-sm text-text-muted mt-3">Type your information directly</p>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Bottom Strip */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 px-8 py-5 flex items-center justify-between border-t border-border-light bg-white/40 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-kiosk-green animate-pulse" />
          <span className="text-sm text-text-secondary font-medium">System Online</span>
        </div>

        <div className="text-sm text-text-secondary font-mono">
          {currentTime.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          •{' '}
          {currentTime.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </motion.footer>
    </div>
  );
}
