const express = require("express");
const { validateRegister, validateLogin } = require("../middleware/userValidation");
const { authenticateToken } = require("../middleware/authMiddleware.js");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter.js");
const { register, login, getProfile,refresh,logout } = require("../controllers/authControllers");

const createAuthRoutes = (prisma) => {
  const router = express.Router();

  router.post(
    "/register",
    registerLimiter,
    validateRegister,
    (req, res) => register(prisma, req, res)
  );

  router.post(
    "/login",
    loginLimiter,
    validateLogin,
    (req, res) => login(prisma, req, res)
  );
  router.post(
  "/logout",
  authenticateToken,
  (req, res) => logout(prisma, req, res)
);

  router.get(
    "/profile",
    authenticateToken,
    (req, res) => getProfile(prisma, req, res)
  );


  router.post(
  "/refresh",
  (req, res) => refresh(prisma, req, res)
);

  return router;
};

module.exports = { createAuthRoutes };