const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory and users.json exist
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read all users from the JSON file
function readUsers() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Write all users to the JSON file
function writeUsers(users) {
  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

class UserModel {
  /**
   * Find a user by their lowercase email address.
   */
  static async findByEmail(email) {
    if (!email) return null;
    const users = readUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Find a user by unique ID.
   */
  static async findById(id) {
    if (!id) return null;
    const users = readUsers();
    return users.find((u) => u.id === id) || null;
  }

  /**
   * Create a new user with hashed password.
   */
  static async create({ name, email, password }) {
    const users = readUsers();

    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Already hashed before passing to create()
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    return newUser;
  }

  /**
   * Return safe representation without password.
   */
  static toSafeObject(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = UserModel;
