const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const config = require('../utils/config');

// JWT Authentication Middleware
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, config.SECRET_KEY);
    const customer = await Customer.findById(decoded.id);
    
    if (!customer) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Customer not found.' 
      });
    }

    req.customer = customer;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Session-based Authentication (for compatibility with existing auth-server)
exports.isAuthenticated = async (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log("User is authenticated");
    return next();
  } else {
    console.log("User is not authenticated");
    return res.status(401).json({ message: "User is not authenticated" });
  }
};

// Admin Authorization
exports.isAdmin = (req, res, next) => {
  if (req.customer && (req.customer.role === 'admin' || req.customer.role === 'sub-admin')) {
    return next();
  } else if (req.isAuthenticated && req.isAuthenticated() && 
             (req.user.role === 'admin' || req.user.role === 'sub-admin')) {
    return next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

// Auth User (for compatibility)
exports.authUser = function (req, res) {
  if (req.customer) {
    // JWT-based authentication
    res.status(200).json({ 
      authenticated: true, 
      customer: req.customer 
    });
  } else if (req.isAuthenticated && req.isAuthenticated()) {
    // Session-based authentication
    res.status(200).json({ 
      authenticated: true, 
      user: req.user 
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
};

// Optional: Customer role check
exports.isCustomer = (req, res, next) => {
  if (req.customer && req.customer.role === 'customer') {
    return next();
  } else {
    res.status(403).json({ message: 'Access denied. Customer role required.' });
  }
};
