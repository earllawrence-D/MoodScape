import rateLimit from 'express-rate-limit';

// --- General API rate limiter ---
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // max requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Auth/login limiter ---
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max login attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true,
});

// --- AI requests limiter ---
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max AI requests
  message: {
    success: false,
    message: 'Too many AI requests, please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Journal creation limiter (per user, daily) ---
export const journalLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // max 10 journal entries per user per day
  message: {
    success: false,
    message: 'You have reached your daily journal entry limit.'
  },
  keyGenerator: (req) => {
    // Use user ID if available, otherwise fallback to IP
    return req.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});
