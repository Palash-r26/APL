// ── FILE: pages/IDScanPage.jsx ── ID card upload + OCR extraction page
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, ArrowLeft, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import KioskButton from '../components/KioskButton';
import PatientForm from '../components/PatientForm';
import { usePatient } from '../context/PatientContext';
import { extractPatientId } from '../api/client';

export default function IDScanPage() {
  const navigate = useNavigate();
  const { setPatientData } = usePatient();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [partialData, setPartialData] = useState(null);
  const [partialPatient, setPartialPatient] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPartialData(null);
    setSelectedFile(file);

    // Generate image preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('idImage', selectedFile);

      const result = await extractPatientId(formData);

      if (result.success && !result.isPartial) {
        // Full success — save patient and navigate
        setPatientData(result.patient);
        navigate('/symptoms');
      } else if (result.isPartial) {
        // Partial OCR — show editable form
        setPartialData(result.partialData || result.extractedData || {});
        setPartialPatient(result.patient);
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 206 && data?.isPartial) {
        // HTTP 206 — partial success
        setPartialData(data.partialData || {});
        setPartialPatient(data.patient);
      } else {
        setError(
          data?.error || data?.message || 'Failed to scan ID card. Please try again or enter details manually.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (formData) => {
    // Merge form data with partial patient info
    const patient = {
      ...partialPatient,
      ...formData,
      isPartial: false,
    };
    setPatientData(patient);
    navigate('/symptoms');
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setPartialData(null);
    setPartialPatient(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center gap-4 px-8 py-5 border-b border-border-light bg-white/60 backdrop-blur-sm">
        <button
          onClick={() => navigate('/')}
          className="p-3 rounded-xl bg-white border border-border-light hover:bg-bg-primary transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Scan Your ID Card</h1>
          <p className="text-sm text-text-muted">Upload a photo of your government-issued ID</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* State: Partial OCR — Show editable form */}
          {partialData && (
            <motion.div
              key="partial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Warning Banner */}
              <div className="flex items-start gap-3 bg-kiosk-amber-light border border-kiosk-amber/30 rounded-xl p-5 mb-6">
                <AlertTriangle className="w-6 h-6 text-kiosk-amber flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-kiosk-amber text-base">
                    Some fields couldn't be read
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    Please verify and correct the information below.
                  </p>
                </div>
              </div>

              <PatientForm initialValues={partialData} onSubmit={handleFormSubmit} />
            </motion.div>
          )}

          {/* State: Error */}
          {!partialData && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="flex items-start gap-3 bg-kiosk-red-light border border-kiosk-red/20 rounded-xl p-5 mb-8">
                <XCircle className="w-6 h-6 text-kiosk-red flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold text-kiosk-red text-base">Scan Failed</p>
                  <p className="text-sm text-text-secondary mt-1">{error}</p>
                </div>
              </div>

              <div className="space-y-3 max-w-sm mx-auto">
                <KioskButton label="Try Again" onClick={handleReset} variant="primary" />
                <KioskButton
                  label="Enter Details Manually"
                  onClick={() => navigate('/symptoms')}
                  variant="secondary"
                />
              </div>
            </motion.div>
          )}

          {/* State: Upload Zone */}
          {!partialData && !error && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative cursor-pointer rounded-2xl border-3 border-dashed
                  transition-all duration-300 overflow-hidden
                  ${
                    preview
                      ? 'border-kiosk-blue bg-kiosk-blue-light/50'
                      : 'border-border-medium bg-white hover:border-kiosk-blue hover:bg-kiosk-blue-light/30'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {preview ? (
                  <div className="p-6">
                    <div className="relative rounded-xl overflow-hidden kiosk-shadow">
                      <img
                        src={preview}
                        alt="ID card preview"
                        className="w-full max-h-[300px] object-contain bg-white"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1.5 rounded-full bg-kiosk-blue text-white text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Ready to scan
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-text-muted text-center mt-4">
                      Tap to choose a different image
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-kiosk-blue/10 to-blue-100 flex items-center justify-center mb-6">
                      <Camera className="w-10 h-10 text-kiosk-blue" />
                    </div>
                    <p className="font-heading font-bold text-xl text-text-primary mb-2">
                      Tap to Scan or Upload Your ID
                    </p>
                    <p className="text-sm text-text-muted flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Supports JPEG, PNG, WebP (max 5MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                {selectedFile && (
                  <KioskButton
                    label="Analyze ID Card"
                    icon={<Camera className="w-6 h-6" />}
                    onClick={handleAnalyze}
                    loading={loading}
                    variant="primary"
                    className="min-h-[100px] text-xl"
                  />
                )}

                <KioskButton
                  label="Skip — Enter Details Manually"
                  onClick={() => navigate('/symptoms')}
                  variant="secondary"
                  disabled={loading}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
