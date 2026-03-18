const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Access token required', 
      code: 'TOKEN_MISSING' 
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'TOKEN_MISSING',
    });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
  if (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(403).json({   // ← make sure this is RETURN
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
  req.user = { id: decoded.userId };
  next();
});
};

module.exports = { authenticateToken };