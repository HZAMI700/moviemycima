const xss = require('xss');

const sanitize = (obj) => {
  if (typeof obj === 'string') return xss(obj.trim());
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) sanitized[key] = sanitize(value);
    return sanitized;
  }
  return obj;
};

const sanitizeInput = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

module.exports = { sanitizeInput, validateObjectId };
