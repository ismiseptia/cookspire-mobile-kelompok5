require('dotenv').config();
const jwt = require('jsonwebtoken');

function readToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Wajib login
function auth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: 'Silakan login terlebih dahulu' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Sesi tidak valid atau sudah kedaluwarsa' });
  }
}

// Boleh tanpa login, tapi kalau ada token yang valid, req.user terisi
function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      /* token salah diabaikan */
    }
  }
  next();
}

module.exports = { auth, optionalAuth };
