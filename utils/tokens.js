const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const HMAC_SECRET = process.env.REFRESH_TOKEN_HMAC_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET || !HMAC_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET, JWT_REFRESH_SECRET and REFRESH_TOKEN_HMAC_SECRET must be set"
  );
}

const ACCESS_EXPIRES  = "45m";
const REFRESH_EXPIRES = "7d";

const hashRefreshToken = (token) => {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(token)
    .digest("hex");
};

const generateAccessAndRefreshTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  const hashedRefreshToken = hashRefreshToken(refreshToken);

  return { accessToken, refreshToken, hashedRefreshToken };
};

module.exports = { generateAccessAndRefreshTokens, hashRefreshToken };