require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseAdminApp = null;

/**
 * Initialize Firebase Admin SDK for project work-mock-c479f
 */
function initFirebase() {
  if (firebaseAdminApp) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'work-mock-c479f';
  const serviceKeyPath = path.join(__dirname, '../../serviceAccountKey.json');

  try {
    if (fs.existsSync(serviceKeyPath)) {
      const serviceAccount = require(serviceKeyPath);
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
      console.log(`🔥 Firebase Admin initialized with serviceAccountKey for project: ${projectId}`);
    } else {
      // Initialize with Project ID for token verification
      firebaseAdminApp = admin.initializeApp({
        projectId,
      });
      console.log(`🔥 Firebase Admin initialized with projectId: ${projectId}`);
    }
  } catch (err) {
    const appsCount = typeof admin.getApps === 'function' ? admin.getApps().length : (Array.isArray(admin.apps) ? admin.apps.length : 0);
    if (appsCount > 0) {
      firebaseAdminApp = typeof admin.app === 'function' ? admin.app() : null;
    } else {
      console.warn('⚠️ Could not initialize Firebase Admin SDK:', err.message);
    }
  }

  return admin;
}

/**
 * Middleware to verify Firebase ID token in Authorization header
 * Expected header: Authorization: Bearer <FIREBASE_ID_TOKEN>
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const appsCount = typeof admin.getApps === 'function' ? admin.getApps().length : (Array.isArray(admin.apps) ? admin.apps.length : 0);
    if (!firebaseAdminApp && appsCount === 0) {
      initFirebase();
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: Missing or invalid Firebase Bearer authorization header.',
      });
    }

    const idToken = authHeader.split(' ')[1];
    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: Firebase ID token is missing.',
      });
    }

    // Verify token using Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken; // Contains uid, email, auth_time, etc.
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error.message);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Firebase session expired: Please refresh your Firebase token.',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid Firebase token signature.',
      error: error.message,
    });
  }
};

module.exports = {
  admin,
  initFirebase,
  verifyFirebaseToken,
};
