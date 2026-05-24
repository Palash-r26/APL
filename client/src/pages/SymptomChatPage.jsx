// ── FILE: pages/SymptomChatPage.jsx ── AI-powered symptom triage chat interface
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Stethoscope, AlertTriangle } from 'lucide-react';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import PriorityBadge from '../components/PriorityBadge';
import KioskButton from '../components/KioskButton';
import { usePatient } from '../context/PatientContext';
import { useSymptomChat } from '../hooks/useSymptomChat';
import { allocateQueue } from '../api/client';

export default function SymptomChatPage() {
  const navigate = useNavigate();
  const { patientData, setTriageResult, setQueueTicket } = usePatient();
  const { messages, sendMessage, loading, triageResult, resetChat } = useSymptomChat();

  const [inputValue, setInputValue] = useState('');
  const [allocating, setAllocating] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    if (!inputValue.trim() || loading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmTriage = async () => {
    if (!triageResult) return;

    setAllocating(true);
    setTriageResult(triageResult);

    try {
      const payload = {
        patientId: patientData?._id || patientData?.id || 'walk-in-' + Date.now(),
        department: triageResult.department,
        priorityTier: triageResult.priorityTier,
      };

      const result = await allocateQueue(payload);

      if (result.success) {
        setQueueTicket({
          ...result.ticket,
          doctorName: result.doctorName,
          queuePosition: result.queuePosition,
          estimatedWaitMinutes: result.estimatedWaitMinutes,
        });
        navigate('/ticket');
      } else {
        // Fallback: create a virtual ticket
        setQueueTicket({
          tokenNumber: `GENMED-${String(Date.now()).slice(-3)}`,
          department: triageResult.department,
          priorityTier: triageResult.priorityTier,
          assignedDoctor: 'Dr. On-Call',
          estimatedWaitMinutes: 15,
          queuePosition: 1,
          status: 'WAITING',
        });
        navigate('/ticket');
      }
    } catch (err) {
      // Even on total failure, navigate with a virtual ticket
      setQueueTicket({
        tokenNumber: `GENMED-${String(Date.now()).slice(-3)}`,
        department: triageResult.department,
        priorityTier: triageResult.priorityTier,
        assignedDoctor: 'Dr. On-Call',
        estimatedWaitMinutes: 15,
        queuePosition: 1,
        status: 'WAITING',
      });
      navigate('/ticket');
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center gap-4 px-8 py-5 border-b border-border-light bg-white/60 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-xl bg-white border border-border-light hover:bg-bg-primary transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kiosk-green to-emerald-500 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-text-primary">Symptom Assessment</h1>
            <p className="text-xs text-text-muted">Powered by AI Triage</p>
          </div>
        </div>

        {patientData?.name && (
          <div className="ml-auto px-4 py-2 rounded-full bg-kiosk-blue-light text-kiosk-blue text-sm font-semibold">
            {patientData.name}
          </div>
        )}
      </header>

      {/* Chat Messages Area */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.map((msg, idx) => (
            <ChatBubble key={idx} role={msg.role} content={msg.content} />
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          {/* Triage Complete Card */}
          <AnimatePresence>
            {triageResult && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl border border-border-light kiosk-shadow p-6 space-y-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg text-text-primary">
                    Triage Assessment
                  </h3>
                  <PriorityBadge tier={triageResult.priorityTier} size="sm" />
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-bg-primary rounded-xl px-5 py-4">
                    <span className="text-sm text-text-muted font-medium">Department</span>
                    <span className="ml-auto font-heading font-bold text-text-primary">
                      {triageResult.department}
                    </span>
                  </div>
                  <div className="bg-bg-primary rounded-xl px-5 py-4">
                    <span className="text-sm text-text-muted font-medium">Reasoning</span>
                    <p className="text-sm text-text-primary mt-1 leading-relaxed">
                      {triageResult.reasoning}
                    </p>
                  </div>
                </div>

                {/* Fallback Warning */}
                {triageResult.isFallback && (
                  <div className="flex items-start gap-2 bg-kiosk-amber-light rounded-xl p-4">
                    <AlertTriangle className="w-5 h-5 text-kiosk-amber flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-text-secondary">
                      AI analysis was unavailable. You've been assigned to General Medicine as a
                      precaution. A doctor will reassess your symptoms.
                    </p>
                  </div>
                )}

                {/* Confirm Button */}
                <KioskButton
                  label="Confirm & Get Queue Ticket"
                  onClick={handleConfirmTriage}
                  loading={allocating}
                  variant="success"
                  className="min-h-[70px]"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Bottom Input Bar */}
      {!triageResult && (
        <div className="flex-shrink-0 border-t border-border-light bg-white/80 backdrop-blur-sm px-8 py-5">
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms..."
              disabled={loading}
              className="flex-1 bg-bg-primary border-2 border-border-light rounded-xl px-5 py-4 text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-kiosk-blue focus:ring-2 focus:ring-kiosk-blue/20 transition-all disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={loading || !inputValue.trim()}
              className="w-14 h-14 rounded-xl bg-gradient-to-r from-kiosk-blue to-blue-600 text-white flex items-center justify-center shadow-lg shadow-kiosk-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-center"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
