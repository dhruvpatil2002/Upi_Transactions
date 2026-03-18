const rateLimit = require('express-rate-limit');



const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,                   
  message: {
    error: "Too many registration attempts, try again later",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,                  
  message: {
    error: "Too many login attempts, try again later",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: "draft-7", 
  legacyHeaders: false,
});


const sendLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10,             
  message: {
    error: "Too many transactions, try again later",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});




const transactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many transactions. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});


const balanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many balance checks. Try again later.' },
  keyGenerator: (req) => req.user?.id || req.ip,
});

module.exports = { 
  registerLimiter,
  loginLimiter, 
  sendLimiter,
  transactionLimiter, 
  balanceLimiter 
};
