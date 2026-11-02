const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// Email validation helper regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Generate a signed JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Step 1: Input Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are all required.',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long.',
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // Step 2: Check if email is already registered
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Step 3: Hash password with salt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Step 4: Save user record to database
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    // Step 5: Issue JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: UserModel.toSafeObject(newUser),
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating account.',
    });
  }
};

/**
 * @route   POST /api/auth/signin
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Input Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Step 2: Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Intentionally generic message to prevent email enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Step 3: Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Step 4: Issue JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: UserModel.toSafeObject(user),
    });
  } catch (error) {
    console.error('Error during signin:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while signing in.',
    });
  }
};

/**
 * @route   GET /api/auth/profile
 * @desc    Get currently logged in user profile
 * @access  Private (Protected by verifyToken middleware)
 */
const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      user: req.user,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = {
  signup,
  signin,
  getProfile,
};
