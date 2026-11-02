# Backend Authentication & Firebase Integration System

A complete Node.js/Express backend authentication system connected to **Firebase Project: `work-mock-c479f`**, featuring both:
1. **🔥 Firebase Authentication**:
   - Backend Sign-Up & Sign-In using Firebase Auth (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`).
   - Firebase ID Token Verification (`admin.auth().verifyIdToken(idToken)`).
   - User database synchronization (syncs Firebase users into local storage).
   - Protected Firebase endpoint (`/api/firebase/profile`).
2. **🔑 Custom JWT & Bcrypt Authentication**:
   - Direct database registration and password hashing with `bcryptjs`.
   - Custom JWT token generation and verification middleware.
3. **💻 Interactive Visual Playground**:
   - Modern dark-mode browser UI at `http://localhost:5000` with live API terminal inspector.

---

## 📁 Project Structure

```
learn-firebase/
├── data/
│   └── users.json                  # Local JSON user store (persists registered users)
├── public/                         # Visual API Testing Playground
│   ├── firebase-config.js          # Client-side Firebase configuration (work-mock-c479f)
│   ├── index.html                  # UI with Firebase & Custom Auth switcher
│   ├── style.css                   # Glassmorphic dark-theme styles
│   └── app.js                      # Dual-mode authentication client
├── userface/                       # Userface Portal (Person Details Inspector)
│   ├── username.html               # User directory & person details viewer
│   ├── username.css                # Glassmorphic styling
│   └── username.js                 # Real-time Firestore & Firebase data loader
├── src/
│   ├── config/
│   │   ├── firebase.js             # Firebase Admin SDK initialization & token verification
│   │   └── firebaseClient.js       # Firebase Client SDK module (Node.js)
│   ├── controllers/
│   │   ├── authController.js       # Custom JWT signup, signin, and profile
│   │   └── firebaseAuthController.js # Firebase signup, signin, verify-token, and profile
│   ├── middleware/
│   │   └── authMiddleware.js       # Custom JWT Bearer token verification middleware
│   ├── models/
│   │   └── userModel.js            # User data repository
│   ├── services/
│   │   └── userService.js          # Firestore 'users' collection CRUD operations
│   ├── routes/
│   │   ├── authRoutes.js           # Custom JWT routes (/api/auth)
│   │   └── firebaseRoutes.js       # Firebase routes (/api/firebase)
│   └── server.js                   # Express server entry point
├── .env                            # Environment variables & Firebase configuration
├── .env.example                    # Template environment variables
├── package.json                    # Project dependencies
└── README.md                       # Documentation
```

---

## 🔥 Connected Firebase Configuration

Your Firebase Project is configured in [`.env`](file:///c:/Users/lucky/OneDrive/Desktop/learn-firebase/.env) and [`public/firebase-config.js`](file:///c:/Users/lucky/OneDrive/Desktop/learn-firebase/public/firebase-config.js):

| Key | Value |
| :--- | :--- |
| **Project ID** | `work-mock-c479f` |
| **Auth Domain** | `work-mock-c479f.firebaseapp.com` |
| **Storage Bucket** | `work-mock-c479f.firebasestorage.app` |
| **App ID** | `1:298064435019:web:5af133975f2b9acd347ace` |

> [!IMPORTANT]
> To use Email/Password authentication with this Firebase project:
> 1. Go to the [Firebase Console](https://console.firebase.google.com/project/work-mock-c479f/authentication/providers).
> 2. Under **Authentication** > **Sign-in method**, make sure **Email/Password** is enabled.

---

## 🚀 Quick Start

### 1. Start the Server
```bash
npm run dev
```

### 2. Open the Playground
Navigate to **[http://localhost:5000](http://localhost:5000)** in your browser to test both Firebase and Custom Auth in real-time.

---

## 📡 API Endpoints Summary

### 🔥 Firebase Endpoints (`/api/firebase`)

| Method | Endpoint | Description | Headers / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/firebase/signup` | Register user in Firebase & sync to DB | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/api/firebase/signin` | Sign in with Firebase & get ID Token | `{ "email": "...", "password": "..." }` |
| `POST` | `/api/firebase/verify-token` | Verify client Firebase token | `{ "idToken": "..." }` |
| `GET` | `/api/firebase/profile` | Protected route (Requires Firebase Token) | `Authorization: Bearer <FIREBASE_ID_TOKEN>` |

### 🔑 Custom JWT Endpoints (`/api/auth`)

| Method | Endpoint | Description | Headers / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Custom registration with Bcrypt | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/api/auth/signin` | Custom signin with Bcrypt compare | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/profile` | Protected route (Requires Custom JWT) | `Authorization: Bearer <CUSTOM_JWT_TOKEN>` |

### ⚙️ Public Config
- `GET /api/config/firebase`: Returns the public Firebase configuration for client applications.
- `GET /api/health`: Server health and uptime check.
