// Userface - Firebase Person Details Inspector JS

const usersListContainer = document.getElementById('usersListContainer');
const userCountBadge = document.getElementById('userCountBadge');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const searchUserForm = document.getElementById('searchUserForm');
const usernameInput = document.getElementById('usernameInput');
const searchBtn = document.getElementById('searchBtn');

const detailsPlaceholder = document.getElementById('detailsPlaceholder');
const personContent = document.getElementById('personContent');

// Detail Elements
const personAvatar = document.getElementById('personAvatar');
const personName = document.getElementById('personName');
const personRole = document.getElementById('personRole');
const personEmail = document.getElementById('personEmail');
const personUid = document.getElementById('personUid');
const copyUidBtn = document.getElementById('copyUidBtn');
const personProvider = document.getElementById('personProvider');
const personCreatedAt = document.getElementById('personCreatedAt');
const personEmailVerified = document.getElementById('personEmailVerified');
const personFirestorePath = document.getElementById('personFirestorePath');
const authConsoleLink = document.getElementById('authConsoleLink');
const firestoreConsoleLink = document.getElementById('firestoreConsoleLink');
const personJsonView = document.getElementById('personJsonView');

let cachedUsers = [];
let activeIdentifier = null;

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();
});

// Refresh Button Listener
refreshUsersBtn.addEventListener('click', () => {
  loadUsers();
});

// Seed Mock Data Button Listener
const seedDataBtn = document.getElementById('seedDataBtn');
if (seedDataBtn) {
  seedDataBtn.addEventListener('click', async () => {
    seedDataBtn.disabled = true;
    seedDataBtn.textContent = 'Seeding...';
    try {
      const res = await fetch('/api/firebase/seed-mock-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadUsers();
      } else {
        alert('Seeding note: ' + data.message);
      }
    } catch (e) {
      console.error('Seeding error:', e);
    } finally {
      seedDataBtn.disabled = false;
      seedDataBtn.textContent = '+ Mock Users';
    }
  });
}

// Search Form Listener
searchUserForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = usernameInput.value.trim();
  if (!query) return;
  fetchPersonDetails(query);
});

// Load all users from Firestore
async function loadUsers() {
  usersListContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Fetching users from Firebase...</span>
    </div>
  `;

  try {
    const res = await fetch('/api/firebase/firestore-users');
    const data = await res.json();

    if (data.success && Array.isArray(data.users) && data.users.length > 0) {
      cachedUsers = data.users;
      renderUsersList(cachedUsers);
      // Auto-open first person if none selected
      if (!activeIdentifier) {
        fetchPersonDetails(cachedUsers[0].uid || cachedUsers[0].email || cachedUsers[0].name);
      }
    } else {
      // If Firestore collection has 0 documents yet, show informative state
      cachedUsers = [];
      userCountBadge.textContent = '0 Users';
      usersListContainer.innerHTML = `
        <div class="empty-users-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>No user documents in Firestore yet.</p>
          <small style="color: var(--text-dim);">Register a user at <a href="http://localhost:5000" target="_blank" style="color: var(--accent-firebase);">http://localhost:5000</a> to create your first Firestore document.</small>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to load users:', error);
    usersListContainer.innerHTML = `
      <div class="empty-users-state" style="color: #f87171;">
        <p>Could not connect to backend.</p>
        <small>${error.message}</small>
      </div>
    `;
  }
}

// Render list of user items
function renderUsersList(users) {
  userCountBadge.textContent = `${users.length} User${users.length === 1 ? '' : 's'}`;
  usersListContainer.innerHTML = '';

  users.forEach((u) => {
    const name = u.name || u.email || 'Anonymous';
    const email = u.email || 'No email';
    const initial = name.charAt(0).toUpperCase();
    const id = u.uid || u.id || email;

    const card = document.createElement('div');
    card.className = `user-item-card ${activeIdentifier === id ? 'active' : ''}`;
    card.dataset.id = id;
    card.innerHTML = `
      <div class="user-avatar-small">${initial}</div>
      <div class="user-info-snippet">
        <span class="user-name-snippet">${escapeHtml(name)}</span>
        <span class="user-email-snippet">${escapeHtml(email)}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      fetchPersonDetails(id);
    });

    usersListContainer.appendChild(card);
  });
}

// Fetch single person's complete details
async function fetchPersonDetails(identifier) {
  activeIdentifier = identifier;
  updateActiveCard(identifier);

  // Show loading in details
  detailsPlaceholder.style.display = 'none';
  personContent.style.display = 'none';

  searchBtn.disabled = true;
  searchBtn.innerHTML = `<span>Searching...</span>`;

  try {
    const encodedId = encodeURIComponent(identifier);
    const res = await fetch(`/api/firebase/user-details/${encodedId}`);
    const data = await res.json();

    if (res.ok && data.success && data.person) {
      renderPersonDetails(data.person);
    } else {
      showErrorState(data.message || `No person details found for "${identifier}"`);
    }
  } catch (error) {
    console.error('Error fetching person details:', error);
    showErrorState('Network error connecting to backend: ' + error.message);
  } finally {
    searchBtn.disabled = false;
    searchBtn.innerHTML = `
      <span>Inspect Person</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
    `;
  }
}

// Render populated person details
function renderPersonDetails(person) {
  detailsPlaceholder.style.display = 'none';
  personContent.style.display = 'flex';

  const name = person.fullName || person.username || 'User';
  personAvatar.textContent = name.charAt(0).toUpperCase();
  personName.textContent = name;
  personRole.textContent = person.role || 'User';
  personEmail.textContent = person.email || 'N/A';
  personUid.textContent = person.uid || 'N/A';

  personProvider.textContent = person.provider || 'password';
  personCreatedAt.textContent = formatDate(person.createdAt);
  personEmailVerified.textContent = person.emailVerified ? 'Yes ✅' : 'No ❌';
  personFirestorePath.textContent = person.firestorePath || `users/${person.uid}`;

  // Console Links
  if (person.firebaseConsoleUrls) {
    authConsoleLink.href = person.firebaseConsoleUrls.authentication;
    firestoreConsoleLink.href = person.firebaseConsoleUrls.firestore;
  }

  // JSON Preview of Firestore Document
  const documentPayload = person.firestoreDocument || {
    uid: person.uid,
    name: person.fullName,
    email: person.email,
    createdAt: person.createdAt,
    role: person.role,
    provider: person.provider,
  };
  personJsonView.textContent = JSON.stringify(documentPayload, null, 2);
}

// Highlight active card
function updateActiveCard(identifier) {
  const cards = usersListContainer.querySelectorAll('.user-item-card');
  cards.forEach((card) => {
    if (card.dataset.id === identifier) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// Show error state
function showErrorState(msg) {
  personContent.style.display = 'none';
  detailsPlaceholder.style.display = 'flex';
  detailsPlaceholder.innerHTML = `
    <div class="placeholder-icon" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4);">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
    </div>
    <h3 style="color: #f87171;">User Not Found in Firebase</h3>
    <p>${escapeHtml(msg)}</p>
    <small style="color: var(--text-dim);">Tip: You can search by username, full email address, or Firebase UID.</small>
  `;
}

// Copy UID
copyUidBtn.addEventListener('click', () => {
  const uid = personUid.textContent;
  if (!uid || uid === '...') return;
  navigator.clipboard.writeText(uid).then(() => {
    copyUidBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyUidBtn.textContent = 'Copy';
    }, 1600);
  });
});

// Helper: Format Date
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
