const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware.js');
const { validateCreateAccount } = require('../middleware/accountValidation.js');
const { createAccount, getAccount } = require('../controllers/accountControllers.js');

const createAccountRoutes = (prisma) => {
  const router = express.Router();

  router.post('/create',
    authenticateToken,
    validateCreateAccount,
    (req, res) => createAccount(prisma, req, res)
  );

  router.get('/',
    authenticateToken,
    (req, res) => getAccount(prisma, req, res)
  );

  return router;
};

module.exports = { createAccountRoutes };