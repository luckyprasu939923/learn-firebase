const express = require('express');
const router = express.Router();
const firebaseAuthController = require('../controllers/firebaseAuthController');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Automatically route all sign-up and sign-in to Firebase & Firestore!
router.post('/signup', firebaseAuthController.firebaseSignup);
router.post('/signin', firebaseAuthController.firebaseSignin);

// Protected endpoint
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
