require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const firebaseRoutes = require('./routes/firebaseRoutes');
const { initFirebase } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin for project work-mock-c479f
initFirebase();

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend UI for testing auth in browser
app.use(express.static(path.join(__dirname, '../public')));
// Serve Userface UI
app.use('/userface', express.static(path.join(__dirname, '../userface')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/firebase', firebaseRoutes);

// Public Firebase Web Client Config Endpoint
app.get('/api/config/firebase', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyC0fAl4tItsI_JNLR0C1G_Mf1fPSAnYJ1g",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "work-mock-c479f.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "work-mock-c479f",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "work-mock-c479f.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "298064435019",
    appId: process.env.FIREBASE_APP_ID || "1:298064435019:web:5af133975f2b9acd347ace",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-K43LTPYPT6",
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 Handler for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Handle malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload. Please check your request body format.',
    });
  }

  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred on the server.',
  });
});

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Auth Backend Server running on port ${PORT}`);
  console.log(`👉 Test Playground: http://localhost:${PORT}`);
  console.log(`🔑 Custom JWT Auth: POST /api/auth/signup & /signin`);
  console.log(`🔥 Firebase Auth:   POST /api/firebase/signup & /signin`);
  console.log(`🔥 Firebase Verify: POST /api/firebase/verify-token`);
  console.log(`🛡️ Protected Route: GET  /api/firebase/profile`);
  console.log(`===============================================`);
});
