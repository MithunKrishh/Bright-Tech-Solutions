const rateLimit = require('express-rate-limit');

function createRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      data: {},
      message: 'Too many requests, please try again later.',
    },
  });
}

module.exports = createRateLimiter;
