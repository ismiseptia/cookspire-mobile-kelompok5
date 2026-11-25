const jwt = require('jsonwebtoken');

// Middleware JWT: membaca header "Authorization: Bearer <token>",
// memverifikasi tanda tangan token, lalu menaruh identitas user di req.user.
// ID user SELALU diambil dari token (bukan dari body/params) supaya tidak bisa dipalsukan.
const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan, silakan login.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id_user: payload.id_user, email: payload.email };
    next();
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      message: expired
        ? 'Sesi login berakhir, silakan login kembali.'
        : 'Token tidak valid, silakan login kembali.',
    });
  }
};

module.exports = { authenticate };
