const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * Middleware to verify JWT authentication token from the Authorization header.
 * Expected format: Authorization: Bearer <token>
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: No authorization header provided.',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Expected format: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: Token is missing.',
      });
    }

    // Verify token with secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: verify that the user still exists in the database
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // Attach user payload to request
    req.user = UserModel.toSafeObject(user);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired: Token has expired. Please sign in again.',
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid token signature.',
    });
  }
};

module.exports = { verifyToken };
