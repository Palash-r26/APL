// ── FILE: index.js ── Zero-Wait OPD Kiosk Express Server Entry Point
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/db');
const triageRoutes = require('./routes/triage.routes');
const queueRoutes = require('./routes/queue.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ═══════════════════════════════════════
// MIDDLEWARE SETUP
// ═══════════════════════════════════════

// CORS: Allow React dev servers
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);

// Parse JSON request bodies (up to 10MB for base64 images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded ID images as static files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

// ═══════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Zero-Wait OPD Kiosk API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Triage routes: ID extraction + symptom analysis
app.use('/api/triage', triageRoutes);

// Queue routes: ticket allocation
app.use('/api/queue', queueRoutes);

// ═══════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);

  // Multer file size/type errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Maximum size is 5MB.',
    });
  }

  if (err.message && err.message.includes('Only JPEG')) {
    return res.status(415).json({
      success: false,
      error: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error. Please try again.',
  });
});

// ═══════════════════════════════════════
// SERVER BOOT
// ═══════════════════════════════════════
const startServer = async () => {
  // Attempt MongoDB connection (non-blocking — server starts regardless)
  const dbConnected = await connectDB();

  app.listen(PORT, () => {
    console.log('');
    console.log('════════════════════════════════════════════');
    console.log('  🏥 Zero-Wait OPD Kiosk — API Server');
    console.log('════════════════════════════════════════════');
    console.log(`  🌐 Server:    http://localhost:${PORT}`);
    console.log(`  💊 Health:    http://localhost:${PORT}/api/health`);
    console.log(`  🗄️  Database:  ${dbConnected ? 'MongoDB Connected ✅' : 'Not connected ⚠️ (using fallbacks)'}`);
    console.log(`  🤖 Gemini AI: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_key_here' ? 'Configured ✅' : 'Not configured ⚠️ (using fallbacks)'}`);
    console.log('════════════════════════════════════════════');
    console.log('');
  });
};

startServer();
