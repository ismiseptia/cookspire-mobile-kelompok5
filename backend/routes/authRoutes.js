const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch {
  bcrypt = require('bcryptjs');
}

// Minimal 8 karakter berupa huruf atau angka
const PASSWORD_REGEX = /^[A-Za-z0-9]{8,}$/;

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const validatePassword = (req, res, next) => {
  const password = req.body.password ?? req.body.newPassword;

  if (!password || !PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password harus minimal 8 karakter berupa huruf atau angka.',
    });
  }

  next();
};

router.post('/register', validatePassword, authController.register);
router.post('/login', authController.login);

// Ambil Profil Pengguna Terbaru dari Database
router.get('/user/profile/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    let rows;

    try {
      [rows] = await db.query(
        'SELECT id_user, nama, email, foto, bio FROM user WHERE id_user = ?',
        [userId]
      );
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        [rows] = await db.query(
          'SELECT id_user, nama, email, foto FROM user WHERE id_user = ?',
          [userId]
        );
      } else {
        throw err;
      }
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    res.json({
      success: true,
      user: { bio: '', ...rows[0] },
    });
  } catch (error) {
    console.error('Error Get Profile:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil profil pengguna.' });
  }
});

// Update Profil Pengguna (Nama, Foto, Bio) ke Database
router.put('/user/profile/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { nama, bio, foto } = req.body;

    if (String(userId) !== String(req.user.id_user)) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat mengubah profil sendiri.' });
    }

    if (!nama || !nama.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap tidak boleh kosong.' });
    }

    const cleanFoto = foto && String(foto).trim() !== '' ? String(foto).trim() : null;
    const cleanBio = bio !== undefined && bio !== null ? String(bio).trim() : '';

    let updatedUsers;
    try {
      await db.query(
        'UPDATE user SET nama = ?, foto = ?, bio = ? WHERE id_user = ?',
        [nama.trim(), cleanFoto, cleanBio, userId]
      );
      [updatedUsers] = await db.query(
        'SELECT id_user, nama, email, foto, bio FROM user WHERE id_user = ?',
        [userId]
      );
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        await db.query(
          'UPDATE user SET nama = ?, foto = ? WHERE id_user = ?',
          [nama.trim(), cleanFoto, userId]
        );
        [updatedUsers] = await db.query(
          'SELECT id_user, nama, email, foto FROM user WHERE id_user = ?',
          [userId]
        );
      } else {
        throw err;
      }
    }

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: { bio: cleanBio, ...updatedUsers[0] },
    });
  } catch (error) {
    console.error('Error Update Profile:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
  }
});

// Store temporary OTP di memory (untuk development)
const otpStore = {};

// 1. Minta Kode OTP Lupa Password
router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
    }

    const [users] = await db.query(
      'SELECT id_user, email FROM user WHERE LOWER(email) = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Email tidak terdaftar.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    console.log(`[DEV OTP] Kode untuk ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'Kode OTP pemulihan telah dikirim.',
      otpDev: otp,
    });
  } catch (error) {
    console.error('Error Forgot Password:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses permintaan.' });
  }
});

// 2. Verifikasi Kode OTP
router.post('/verify-otp', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  const record = otpStore[email];

  if (!record || record.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Kode OTP salah atau tidak ditemukan.' });
  }

  if (Date.now() > record.expires) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'Kode OTP telah kadaluarsa.' });
  }

  res.json({ success: true, message: 'Kode OTP valid.' });
});

// 3. Reset Password Baru
router.post('/reset-password', validatePassword, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    const rawPassword = req.body.newPassword ?? req.body.password;
    const record = otpStore[email];

    if (!record || record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Sesi reset password tidak valid.' });
    }

    if (Date.now() > record.expires) {
      delete otpStore[email];
      return res.status(400).json({ success: false, message: 'Kode OTP telah kadaluarsa.' });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await db.query('UPDATE user SET password = ? WHERE LOWER(email) = ?', [
      hashedPassword,
      email,
    ]);
    delete otpStore[email];

    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (error) {
    console.error('Error Reset Password:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah password.' });
  }
});

module.exports = router;