const express = require("express");
const { 
  validateSendTransaction, 
  validatePaymentRequest, 
  validateTransactionStatus 
} = require("../middleware/userValidation");
const { authenticateToken } = require("../middleware/authMiddleware.js");
const { transactionLimiter, balanceLimiter, sendLimiter } = require("../middleware/rateLimiter.js");
const { 
  createSendTransaction, 
  checkTransactionStatus, 
  getTransactionHistory, 
  getBalance, 
  createPaymentRequest,
  acceptPaymentRequest, 
} = require("../controllers/transactionControllers.js");

const createTransactionRoutes = (prisma) => {
  const router = express.Router();

  router.post("/send",
    authenticateToken,
    validateSendTransaction,
    sendLimiter,
    transactionLimiter,
    (req, res) => createSendTransaction(prisma)(req, res)
  );

  router.get("/balance",
    authenticateToken,
    balanceLimiter,
    getBalance(prisma)
  );

  router.get("/status/:utr",
    authenticateToken,
    validateTransactionStatus,
    checkTransactionStatus(prisma)
  );

  router.get("/",
    authenticateToken,
    getTransactionHistory(prisma)
  );

  router.post("/request",
    authenticateToken,
    validatePaymentRequest,
    transactionLimiter,
    createPaymentRequest(prisma)
  );

  router.post("/accept/:utr",       
    authenticateToken,
    transactionLimiter,
    (req, res) => acceptPaymentRequest(prisma)(req, res)
  );

  return router;
};

module.exports = { createTransactionRoutes };