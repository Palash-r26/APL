// ── FILE: index.js ── Zero-Wait OPD Kiosk Express Server Entry Point
// Socket.io enabled for real-time insurance alert agent
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const triageRoutes = require('./routes/triage.routes');
const queueRoutes = require('./routes/queue.routes');
const realtimeRoutes = require('./routes/realtime.routes');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// ═══════════════════════════════════════
// SOCKET.IO SETUP — Real-time alerts
// ═══════════════════════════════════════
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io instance to app so middleware can access it via req.app.get('io')
app.set('io', io);

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Allow clients to join named rooms (e.g., 'staff-dashboard')
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`   └─ ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

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
    version: '1.1.0',
    socketClients: io.engine.clientsCount,
  });
});

// Triage routes: ID extraction + symptom analysis
app.use('/api/triage', triageRoutes);

// Queue routes: ticket allocation + insurance alert agent
app.use('/api/queue', queueRoutes);
app.use('/api/realtime', realtimeRoutes);

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

  // Listen on httpServer (not app) so Socket.io shares the same port
  httpServer.listen(PORT, () => {
    console.log('');
    console.log('════════════════════════════════════════════');
    console.log('  🏥 Zero-Wait OPD Kiosk — API Server');
    console.log('════════════════════════════════════════════');
    console.log(`  🌐 Server:    http://localhost:${PORT}`);
    console.log(`  💊 Health:    http://localhost:${PORT}/api/health`);
    console.log(`  🗄️  Database:  ${dbConnected ? 'MongoDB Connected ✅' : 'Not connected ⚠️ (using fallbacks)'}`);
    console.log(`  🤖 Gemini AI: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_key_here' ? 'Configured ✅' : 'Not configured ⚠️ (using fallbacks)'}`);
    console.log(`  🎙️  OpenAI Realtime: ${process.env.OPENAI_API_KEY ? 'Configured ✅' : 'Not configured ⚠️'}`);
    console.log(`  🔌 Socket.io: Real-time alerts enabled ✅`);
    console.log('════════════════════════════════════════════');
    console.log('');
  });
};

startServer();
