// State
let currentToken = localStorage.getItem('auth_firebase_token') || null;

// DOM Elements
const tabSignup = document.getElementById('tabSignup');
const tabSignin = document.getElementById('tabSignin');
const signupForm = document.getElementById('signupForm');
const signinForm = document.getElementById('signinForm');

const signupSubmitBtn = document.getElementById('signupSubmitBtn');
const signinSubmitBtn = document.getElementById('signinSubmitBtn');

const tokenDisplay = document.getElementById('tokenDisplay');
const copyTokenBtn = document.getElementById('copyTokenBtn');
const fetchProfileBtn = document.getElementById('fetchProfileBtn');
const viewFirestoreBtn = document.getElementById('viewFirestoreBtn');
const logoutBtn = document.getElementById('logoutBtn');
const sessionStatusBadge = document.getElementById('sessionStatusBadge');

const apiConsole = document.getElementById('apiConsole');
const responseStatus = document.getElementById('responseStatus');
const responseTime = document.getElementById('responseTime');

// Initialize
updateSessionUI();

// Tab Switching
tabSignup.addEventListener('click', () => {
  tabSignup.classList.add('active');
  tabSignin.classList.remove('active');
  signupForm.classList.add('active');
  signinForm.classList.remove('active');
});

tabSignin.addEventListener('click', () => {
  tabSignin.classList.add('active');
  tabSignup.classList.remove('active');
  signinForm.classList.add('active');
  signupForm.classList.remove('active');
});

// Update Session UI
function updateSessionUI() {
  if (currentToken) {
    sessionStatusBadge.textContent = 'Firebase Authenticated';
    sessionStatusBadge.className = 'session-badge authenticated';
    tokenDisplay.textContent = currentToken;
    tokenDisplay.classList.remove('placeholder');
    copyTokenBtn.disabled = false;
    fetchProfileBtn.disabled = false;
    logoutBtn.disabled = false;
  } else {
    sessionStatusBadge.textContent = 'Not Logged In';
    sessionStatusBadge.className = 'session-badge unauthenticated';
    tokenDisplay.textContent = 'No token generated yet. Sign up or sign in to receive a Firebase token.';
    tokenDisplay.classList.add('placeholder');
    copyTokenBtn.disabled = true;
    fetchProfileBtn.disabled = true;
    logoutBtn.disabled = true;
  }
}

// Live Terminal Logger
function logToInspector(endpoint, method, status, duration, data) {
  responseStatus.textContent = `${method} ${status}`;
  responseStatus.className = 'http-status';
  if (status >= 200 && status < 300) {
    responseStatus.classList.add('status-2xx');
  } else if (status >= 400 && status < 500) {
    responseStatus.classList.add('status-4xx');
  } else {
    responseStatus.classList.add('status-5xx');
  }

  responseTime.textContent = `${duration} ms`;

  const formattedOutput =
    `// Endpoint: ${method} ${endpoint}\n// Provider: FIREBASE + FIRESTORE\n// Time: ${new Date().toLocaleTimeString()} (${duration}ms)\n\n` +
    JSON.stringify(data, null, 2);
  apiConsole.innerHTML = `<code>${escapeHtml(formattedOutput)}</code>`;
  apiConsole.scrollTop = 0;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// SIGN UP HANDLER (AUTOMATICALLY SAVES TO FIREBASE AUTH & CLOUD FIRESTORE)
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  signupSubmitBtn.disabled = true;
  signupSubmitBtn.innerHTML = `<span>Saving to Firebase &amp; Firestore...</span>`;

  const startTime = performance.now();

  try {
    const res = await fetch('/api/firebase/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const duration = Math.round(performance.now() - startTime);
    const data = await res.json();

    logToInspector('/api/firebase/signup', 'POST', res.status, duration, data);

    if (res.ok && data.idToken) {
      currentToken = data.idToken;
      localStorage.setItem('auth_firebase_token', currentToken);
      updateSessionUI();
    }
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logToInspector('/api/firebase/signup', 'POST', 500, duration, { error: error.message });
  } finally {
    signupSubmitBtn.disabled = false;
    signupSubmitBtn.innerHTML = `
      <span>Create Account &amp; Save to Firestore</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    `;
  }
});

// SIGN IN HANDLER (AUTHENTICATES WITH FIREBASE AUTH)
signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signinEmail').value;
  const password = document.getElementById('signinPassword').value;

  signinSubmitBtn.disabled = true;
  signinSubmitBtn.innerHTML = `<span>Signing in via Firebase...</span>`;

  const startTime = performance.now();

  try {
    const res = await fetch('/api/firebase/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const duration = Math.round(performance.now() - startTime);
    const data = await res.json();

    logToInspector('/api/firebase/signin', 'POST', res.status, duration, data);

    if (res.ok && data.idToken) {
      currentToken = data.idToken;
      localStorage.setItem('auth_firebase_token', currentToken);
      updateSessionUI();
    }
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logToInspector('/api/firebase/signin', 'POST', 500, duration, { error: error.message });
  } finally {
    signinSubmitBtn.disabled = false;
    signinSubmitBtn.innerHTML = `
      <span>Sign In with Firebase</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    `;
  }
});

// FETCH PROTECTED PROFILE HANDLER
fetchProfileBtn.addEventListener('click', async () => {
  if (!currentToken) return;

  fetchProfileBtn.disabled = true;
  const startTime = performance.now();

  try {
    const res = await fetch('/api/firebase/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
    });

    const duration = Math.round(performance.now() - startTime);
    const data = await res.json();

    logToInspector('/api/firebase/profile', 'GET', res.status, duration, data);

    if (res.status === 401 || res.status === 403) {
      currentToken = null;
      localStorage.removeItem('auth_firebase_token');
      updateSessionUI();
    }
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logToInspector('/api/firebase/profile', 'GET', 500, duration, { error: error.message });
  } finally {
    fetchProfileBtn.disabled = false;
  }
});

// VIEW CLOUD FIRESTORE USERS HANDLER
if (viewFirestoreBtn) {
  viewFirestoreBtn.addEventListener('click', async () => {
    viewFirestoreBtn.disabled = true;
    const startTime = performance.now();

    try {
      const res = await fetch('/api/firebase/firestore-users');
      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();
      logToInspector('/api/firebase/firestore-users', 'GET', res.status, duration, data);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      logToInspector('/api/firebase/firestore-users', 'GET', 500, duration, { error: error.message });
    } finally {
      viewFirestoreBtn.disabled = false;
    }
  });
}

// LOGOUT HANDLER
logoutBtn.addEventListener('click', () => {
  currentToken = null;
  localStorage.removeItem('auth_firebase_token');
  updateSessionUI();
  logToInspector('CLIENT', 'SIGNOUT', 200, 0, {
    message: 'Firebase token cleared. Signed out successfully.',
  });
});

// COPY TOKEN HANDLER
copyTokenBtn.addEventListener('click', () => {
  if (!currentToken) return;
  navigator.clipboard.writeText(currentToken).then(() => {
    const originalText = copyTokenBtn.querySelector('span').textContent;
    copyTokenBtn.querySelector('span').textContent = 'Copied!';
    setTimeout(() => {
      copyTokenBtn.querySelector('span').textContent = originalText;
    }, 1800);
  });
});
