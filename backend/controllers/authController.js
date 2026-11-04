const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Register User (US-01)
exports.register = async (req, res) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ message: 'Semua kolom wajib diisi!' });
  }

  try {
    // Cek apakah email sudah terdaftar
    const [existingUser] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email sudah digunakan!' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke database
    const [result] = await db.query(
      'INSERT INTO user (nama, email, password) VALUES (?, ?, ?)',
      [nama, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Registrasi berhasil!',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 2. Login User (US-02)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi!' });
  }

  try {
    // Cari user berdasarkan email
    const [users] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Email atau password salah!' });
    }

    const user = users[0];

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau password salah!' });
    }

    // Buat JWT Token
    const token = jwt.sign(
      { id_user: user.id_user, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil!',
      token,
      user: {
        id_user: user.id_user,
        nama: user.nama,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};