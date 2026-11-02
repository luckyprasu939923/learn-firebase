const {
  clientAuth,
  clientDb,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
} = require('../config/firebaseClient');
const UserModel = require('../models/userModel');
const UserService = require('../services/userService');
const { admin } = require('../config/firebase');

/**
 * Sign up directly through Firebase Auth (Email/Password) & save to Cloud Firestore
 * @route POST /api/firebase/signup
 */
const firebaseSignup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Firebase passwords must be at least 6 characters long.',
      });
    }

    // 1. Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Get Firebase ID Token
    const idToken = await firebaseUser.getIdToken();

    // 3. Automatically Save User Profile Document to Cloud Firestore (Collection: 'users') via UserService
    let firestoreStatus = {
      saved: false,
      collection: 'users',
      documentId: firebaseUser.uid,
      path: `users/${firebaseUser.uid}`,
      data: null,
    };

    try {
      // Timeout protection (2.5s) in case Firestore database is not yet created in Firebase Console
      const savePromise = UserService.createUser({
        uid: firebaseUser.uid,
        name,
        email: firebaseUser.email,
        role: 'user',
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Cloud Firestore database is not created yet. Please click "Create database" in Firebase Console: https://console.firebase.google.com/project/work-mock-c479f/firestore'
              )
            ),
          2500
        )
      );

      const createdDoc = await Promise.race([savePromise, timeoutPromise]);
      firestoreStatus.saved = true;
      firestoreStatus.data = createdDoc;
    } catch (fsError) {
      console.warn('⚠️ [UserService] Cloud Firestore note:', fsError.message);
      firestoreStatus.saved = false;
      firestoreStatus.help =
        'To see documents in Firestore, enable Cloud Firestore at: https://console.firebase.google.com/project/work-mock-c479f/firestore';
      firestoreStatus.message = fsError.message;
    }

    // 4. Sync to local database
    let dbUser = await UserModel.findByEmail(email);
    if (!dbUser) {
      dbUser = await UserModel.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: 'FIREBASE_AUTH_MANAGED',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'User registered in Firebase Auth and profile saved to Cloud Firestore.',
      provider: 'firebase',
      idToken,
      firebaseUser: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
      },
      firestore: firestoreStatus,
      localUser: UserModel.toSafeObject(dbUser),
    });
  } catch (error) {
    console.error('Firebase signup error:', error.message);
    let message = 'Failed to create account in Firebase.';
    if (error.code === 'auth/email-already-in-use') {
      message = 'This email is already in use in Firebase.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address provided.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Firebase requires a stronger password.';
    } else if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
      message = 'Email/Password sign-in provider is not enabled in Firebase Console for work-mock-c479f. Please enable it in Firebase Console > Authentication > Sign-in method.';
    }

    return res.status(400).json({
      success: false,
      message,
      errorCode: error.code,
    });
  }
};

/**
 * Sign in directly through Firebase Auth (Email/Password)
 * @route POST /api/firebase/signin
 */
const firebaseSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Sign in using Firebase Client SDK
    const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
    const firebaseUser = userCredential.user;

    // Retrieve fresh ID token
    const idToken = await firebaseUser.getIdToken();

    // Sync to local database
    let dbUser = await UserModel.findByEmail(email);
    if (!dbUser) {
      dbUser = await UserModel.create({
        name: firebaseUser.displayName || email.split('@')[0],
        email: email.toLowerCase(),
        password: 'FIREBASE_AUTH_MANAGED',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Signed in via Firebase successfully.',
      provider: 'firebase',
      idToken,
      firebaseUser: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      },
      localUser: UserModel.toSafeObject(dbUser),
    });
  } catch (error) {
    console.error('Firebase signin error:', error.message);
    let message = 'Invalid Firebase credentials.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'Invalid email or password.';
    } else if (error.code === 'auth/operation-not-allowed') {
      message = 'Email/Password auth is not enabled yet in your Firebase project console.';
    }

    return res.status(401).json({
      success: false,
      message,
      errorCode: error.code,
    });
  }
};

/**
 * Verify a Firebase ID Token sent from Client (React, Mobile, Web)
 * @route POST /api/firebase/verify-token
 */
const verifyTokenEndpoint = async (req, res) => {
  try {
    const { idToken } = req.body;
    const token = idToken || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'idToken is required in body or Authorization header.',
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    // Sync user with local database
    let localUser = await UserModel.findByEmail(decoded.email);
    if (!localUser && decoded.email) {
      localUser = await UserModel.create({
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        password: 'FIREBASE_AUTH_MANAGED',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Firebase token verified successfully.',
      decodedToken: decoded,
      localUser: UserModel.toSafeObject(localUser),
    });
  } catch (error) {
    console.error('Token verify error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Failed to verify Firebase token: ' + error.message,
    });
  }
};

/**
 * Protected route using verifyFirebaseToken middleware
 * @route GET /api/firebase/profile
 */
const getFirebaseProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Access granted to Firebase protected profile.',
    firebaseUser: req.firebaseUser,
  });
};

/**
 * Fetch all user profile documents from Cloud Firestore ('users' collection) via UserService
 * @route GET /api/firebase/firestore-users
 */
const getFirestoreUsers = async (req, res) => {
  try {
    const usersList = await UserService.getAllUsers();

    return res.status(200).json({
      success: true,
      message: `Retrieved ${usersList.length} documents from Firestore 'users' collection.`,
      collection: 'users',
      count: usersList.length,
      users: usersList,
    });
  } catch (error) {
    console.error('Error querying Firestore:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to read from Cloud Firestore: ' + error.message,
      help: 'Make sure Cloud Firestore database is created in Firebase Console: https://console.firebase.google.com/project/work-mock-c479f/firestore',
    });
  }
};

/**
 * Create user document directly in Firestore 'users' collection
 * @route POST /api/firebase/users
 */
const createFirestoreUser = async (req, res) => {
  try {
    const { uid, name, email, role, ...extra } = req.body;
    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: 'uid and email are required to create a user in Firestore.',
      });
    }

    const createdUser = await UserService.createUser({ uid, name, email, role, ...extra });
    return res.status(201).json({
      success: true,
      message: "User document created in Firestore 'users' collection successfully.",
      user: createdUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update user document in Firestore 'users' collection
 * @route PUT /api/firebase/users/:uid
 */
const updateFirestoreUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const updatedUser = await UserService.updateUser(uid, req.body);
    return res.status(200).json({
      success: true,
      message: `User '${uid}' updated in Firestore 'users' collection.`,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete user document from Firestore 'users' collection
 * @route DELETE /api/firebase/users/:uid
 */
const deleteFirestoreUser = async (req, res) => {
  try {
    const { uid } = req.params;
    await UserService.deleteUser(uid);
    return res.status(200).json({
      success: true,
      message: `User '${uid}' deleted from Firestore 'users' collection.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Fetch a specific person's complete details from Firebase (Firestore + Auth)
 * @route GET /api/firebase/user-details/:identifier
 */
const getUserDetails = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Identifier is required.' });
    }

    const cleanId = decodeURIComponent(identifier).trim().toLowerCase();
    let firestoreData = null;
    let foundDocId = null;

    // 1. Try fetching directly by document ID in Firestore
    try {
      const docRef = doc(clientDb, 'users', identifier.trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        firestoreData = docSnap.data();
        foundDocId = docSnap.id;
      }
    } catch (e) {
      // ignore, continue searching
    }

    // 2. If not found by doc id, search all Firestore docs by email or name/username
    if (!firestoreData) {
      try {
        const usersSnapshot = await getDocs(collection(clientDb, 'users'));
        usersSnapshot.forEach((d) => {
          const data = d.data();
          const docEmail = (data.email || '').toLowerCase();
          const docName = (data.name || '').toLowerCase();
          const docUid = (data.uid || '').toLowerCase();
          if (
            docEmail === cleanId ||
            docName === cleanId ||
            docUid === cleanId ||
            docName.includes(cleanId)
          ) {
            firestoreData = data;
            foundDocId = d.id;
          }
        });
      } catch (e) {
        // ignore Firestore read error
      }
    }

    // 3. Check local UserModel as fallback
    let localData = await UserModel.findByEmail(cleanId);
    if (!localData && !isNaN(cleanId)) {
      localData = await UserModel.findById(identifier.trim());
    }

    // 4. Try querying Firebase Admin Auth if initialized
    let firebaseAuthData = null;
    const adminAppsCount = admin && (typeof admin.getApps === 'function' ? admin.getApps().length : (Array.isArray(admin.apps) ? admin.apps.length : 0));
    if (adminAppsCount > 0) {
      try {
        const targetUid = (firestoreData && firestoreData.uid) || foundDocId || identifier.trim();
        const authUser = await admin.auth().getUser(targetUid);
        firebaseAuthData = {
          uid: authUser.uid,
          email: authUser.email,
          emailVerified: authUser.emailVerified,
          displayName: authUser.displayName,
          disabled: authUser.disabled,
          creationTime: authUser.metadata.creationTime,
          lastSignInTime: authUser.metadata.lastSignInTime,
          providerId: authUser.providerData[0] ? authUser.providerData[0].providerId : 'password',
        };
      } catch (authErr) {
        // Try searching by email
        if (cleanId.includes('@')) {
          try {
            const authUser = await admin.auth().getUserByEmail(cleanId);
            firebaseAuthData = {
              uid: authUser.uid,
              email: authUser.email,
              emailVerified: authUser.emailVerified,
              displayName: authUser.displayName,
              disabled: authUser.disabled,
              creationTime: authUser.metadata.creationTime,
              lastSignInTime: authUser.metadata.lastSignInTime,
              providerId: authUser.providerData[0] ? authUser.providerData[0].providerId : 'password',
            };
          } catch (e2) {
            // ignore
          }
        }
      }
    }

    if (!firestoreData && !firebaseAuthData && !localData) {
      return res.status(404).json({
        success: false,
        message: `No person details found in Firebase for: ${identifier}`,
      });
    }

    // Compile comprehensive person details
    const uid = (firebaseAuthData && firebaseAuthData.uid) || (firestoreData && firestoreData.uid) || foundDocId || (localData && localData.id) || 'unknown';
    const email = (firebaseAuthData && firebaseAuthData.email) || (firestoreData && firestoreData.email) || (localData && localData.email) || 'N/A';
    const name = (firestoreData && firestoreData.name) || (firebaseAuthData && firebaseAuthData.displayName) || (localData && localData.name) || email.split('@')[0];

    const personDetails = {
      username: name,
      fullName: name,
      email: email,
      uid: uid,
      role: (firestoreData && firestoreData.role) || 'User',
      createdAt: (firebaseAuthData && firebaseAuthData.creationTime) || (firestoreData && firestoreData.createdAt) || (localData && localData.createdAt) || new Date().toISOString(),
      lastSignInTime: (firebaseAuthData && firebaseAuthData.lastSignInTime) || 'Recent',
      provider: (firebaseAuthData && firebaseAuthData.providerId) || (firestoreData && firestoreData.provider) || 'password',
      emailVerified: firebaseAuthData ? firebaseAuthData.emailVerified : false,
      firestorePath: foundDocId ? `users/${foundDocId}` : `users/${uid}`,
      firestoreDocument: firestoreData || null,
      firebaseAuthRecord: firebaseAuthData || null,
      localRecord: localData ? UserModel.toSafeObject(localData) : null,
      firebaseConsoleUrls: {
        authentication: `https://console.firebase.google.com/project/work-mock-c479f/authentication/users`,
        firestore: `https://console.firebase.google.com/project/work-mock-c479f/firestore/databases/-default-/data/~2Fusers~2F${uid}`,
      },
    };

    return res.status(200).json({
      success: true,
      message: `Person details retrieved successfully for '${identifier}'.`,
      person: personDetails,
    });
  } catch (err) {
    console.error('Error in getUserDetails:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving person details: ' + err.message,
    });
  }
};

module.exports = {
  firebaseSignup,
  firebaseSignin,
  verifyTokenEndpoint,
  getFirebaseProfile,
  getFirestoreUsers,
  getUserDetails,
  createFirestoreUser,
  updateFirestoreUser,
  deleteFirestoreUser,
};


