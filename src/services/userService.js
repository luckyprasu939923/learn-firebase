const {
  clientAuth,
  clientDb,
  createUserWithEmailAndPassword,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
} = require('../config/firebaseClient');
const { admin } = require('../config/firebase');

const USERS_COLLECTION = 'users';

class UserService {
  /**
   * Create a new user profile document in Firestore 'users' collection
   * @param {Object} userData - User details { uid, name, email, role, ... }
   * @returns {Promise<Object>} The stored user profile document
   */
  static async createUser({ uid, name, email, role = 'user', ...extraData }) {
    if (!uid) {
      throw new Error('User UID is required to create a document in Firestore.');
    }

    const userDocRef = doc(clientDb, USERS_COLLECTION, uid);
    const now = new Date().toISOString();

    const userProfile = {
      uid,
      name: (name || email.split('@')[0]).trim(),
      email: email.toLowerCase().trim(),
      role: role || 'user',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      provider: 'firebase',
      ...extraData,
    };

    // Save document to Firestore
    await setDoc(userDocRef, userProfile);
    console.log(`🔥 [UserService] Created user document in Firestore: ${USERS_COLLECTION}/${uid}`);

    return userProfile;
  }

  /**
   * Get user document from Firestore by UID
   * @param {string} uid - Firebase User UID
   * @returns {Promise<Object|null>} The user document data or null
   */
  static async getUserById(uid) {
    if (!uid) return null;
    const userDocRef = doc(clientDb, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() };
  }

  /**
   * Find a user document by email address in Firestore
   * @param {string} email - User email address
   * @returns {Promise<Object|null>} The user document or null
   */
  static async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const q = query(collection(clientDb, USERS_COLLECTION), where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const firstDoc = querySnapshot.docs[0];
        return { id: firstDoc.id, ...firstDoc.data() };
      }
    } catch (err) {
      // Fallback: iterate documents if query indexing is pending
      const allDocs = await this.getAllUsers();
      return allDocs.find((u) => (u.email || '').toLowerCase() === cleanEmail) || null;
    }

    return null;
  }

  /**
   * Fetch all user documents from the Firestore 'users' collection
   * @returns {Promise<Array<Object>>} Array of user profile documents
   */
  static async getAllUsers() {
    const usersCollection = collection(clientDb, USERS_COLLECTION);
    const snapshot = await getDocs(usersCollection);

    const usersList = [];
    snapshot.forEach((docSnap) => {
      usersList.push({ id: docSnap.id, ...docSnap.data() });
    });

    return usersList;
  }

  /**
   * Update an existing user document in Firestore 'users' collection
   * @param {string} uid - User UID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} The updated document
   */
  static async updateUser(uid, updateData) {
    if (!uid) {
      throw new Error('User UID is required to update Firestore document.');
    }

    const userDocRef = doc(clientDb, USERS_COLLECTION, uid);
    const updates = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(userDocRef, updates);
    console.log(`🔥 [UserService] Updated user document: ${USERS_COLLECTION}/${uid}`);

    return await this.getUserById(uid);
  }

  /**
   * Delete a user document from Firestore 'users' collection
   * @param {string} uid - User UID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async deleteUser(uid) {
    if (!uid) return false;
    const userDocRef = doc(clientDb, USERS_COLLECTION, uid);
    await deleteDoc(userDocRef);
    console.log(`🔥 [UserService] Deleted user document: ${USERS_COLLECTION}/${uid}`);
    return true;
  }

  /**
   * Combined Helper: Register user in Firebase Authentication AND create document in Firestore
   * @param {Object} param0 - { name, email, password, role }
   * @returns {Promise<Object>} { firebaseUser, idToken, firestoreDoc }
   */
  static async registerUserWithAuthAndFirestore({ name, email, password, role = 'user' }) {
    // 1. Create account in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Obtain ID Token
    const idToken = await firebaseUser.getIdToken();

    // 3. Create document in Cloud Firestore 'users' collection
    const firestoreDoc = await this.createUser({
      uid: firebaseUser.uid,
      name,
      email,
      role,
    });

    return {
      firebaseUser: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
      },
      idToken,
      firestoreDoc,
    };
  }
}

module.exports = UserService;
