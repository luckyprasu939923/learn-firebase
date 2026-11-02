const express = require('express');
const router = express.Router();
const firebaseAuthController = require('../controllers/firebaseAuthController');
const { verifyFirebaseToken } = require('../config/firebase');

// Firebase Auth operations
router.post('/signup', firebaseAuthController.firebaseSignup);
router.post('/signin', firebaseAuthController.firebaseSignin);
router.post('/verify-token', firebaseAuthController.verifyTokenEndpoint);

// Protected Firebase profile route (Requires: Authorization: Bearer <FIREBASE_ID_TOKEN>)
router.get('/profile', verifyFirebaseToken, firebaseAuthController.getFirebaseProfile);

// Cloud Firestore 'users' collection CRUD operations
router.get('/firestore-users', firebaseAuthController.getFirestoreUsers);
router.get('/users', firebaseAuthController.getFirestoreUsers);
router.post('/users', firebaseAuthController.createFirestoreUser);
router.put('/users/:uid', firebaseAuthController.updateFirestoreUser);
router.delete('/users/:uid', firebaseAuthController.deleteFirestoreUser);

// Query a specific person's complete details by username, email, or UID
router.get('/user-details/:identifier', firebaseAuthController.getUserDetails);

const { seedData } = require('../scripts/seedMockData');

// Seed mock data endpoint
router.post('/seed-mock-data', async (req, res) => {
  try {
    const results = await seedData();
    res.status(200).json({
      success: true,
      message: `Successfully seeded ${results.length} mock users into Cloud Firestore.`,
      users: results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
