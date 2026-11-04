const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Update Profil Pengguna (Figma 4.6)
router.put('/user/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nama, bio } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap tidak boleh kosong.' });
    }

    await db.query(
      'UPDATE user SET nama = ? WHERE id_user = ?',
      [nama.trim(), userId]
    );

    // Ambil data user terbaru untuk diperbarui di AsyncStorage
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

// 1. Minta Kode OTP Lupa Password (Figma 1.7)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await db.query('SELECT * FROM user WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Email tidak terdaftar.' });
    }

    // Generate 6 Digit OTP acak
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // Berlaku 5 menit

    console.log(`[DEV OTP] Kode untuk ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'Kode OTP pemulihan telah dikirim.',
      otpDev: otp, // Dikembalikan untuk pengujian lokal
    });
  } catch (error) {
    console.error('Error Forgot Password:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses permintaan.' });
  }
});

// 2. Verifikasi Kode OTP (Figma 1.8)
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
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

// 3. Reset Password Baru (Figma 1.9)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const record = otpStore[email];

    if (!record || record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Sesi reset password tidak valid.' });
    }

    await db.query('UPDATE user SET password = ? WHERE email = ?', [newPassword, email]);
    delete otpStore[email];

    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (error) {
    console.error('Error Reset Password:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah password.' });
  }
});

module.exports = router;