const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateAccessAndRefreshTokens, hashRefreshToken } = require('../utils/tokens');

const DUMMY_HASH = '$2b$12$invalidhashpaddingtowastetime000000000000000000000000';

const register = async (prisma, req, res) => {
  const { phone, password, name, email } = req.body;

  try {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(409).json({ error: 'Phone already in use' });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { phone, passwordHash: hashedPassword, name, email },
    });

    const { accessToken, refreshToken, hashedRefreshToken } =
      await generateAccessAndRefreshTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Credential already in use' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (prisma, req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { phone } });

    const passwordMatch = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH
    );

    if (!user || !passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken, hashedRefreshToken } =
      await generateAccessAndRefreshTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (prisma, req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const refresh = async (prisma, req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const incomingHashed = hashRefreshToken(refreshToken);
    if (incomingHashed !== user.refreshToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      return res.status(401).json({ error: 'Refresh token reuse detected. Please log in again.' });
    }

    const { accessToken, refreshToken: newRefreshToken, hashedRefreshToken } =
      await generateAccessAndRefreshTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (prisma, req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, getProfile, refresh,logout};