const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authController = require('../controllers/authController');

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

// Update Profil Pengguna
router.put('/user/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nama, bio } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap tidak boleh kosong.' });
    }

    await db.query('UPDATE user SET nama = ? WHERE id_user = ?', [nama.trim(), userId]);

    const [updatedUsers] = await db.query(
      'SELECT id_user, nama, email FROM user WHERE id_user = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: { ...updatedUsers[0], bio: bio || '' },
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
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // Berlaku 5 menit

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

// 3. Reset Password Baru (Hash dengan bcrypt sebelum disimpan)
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