require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../utils');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

const buatToken = (u) =>
  jwt.sign({ id_user: u.id_user, nama: u.nama, email: u.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// US-01 Registrasi
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const nama = String(req.body.nama || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const errors = {};
    if (!nama) errors.nama = 'Nama wajib diisi';
    if (!EMAIL_RE.test(email)) errors.email = 'Format email tidak valid';
    if (password.length < MIN_PASSWORD)
      errors.password = `Password minimal ${MIN_PASSWORD} karakter`;
    if (Object.keys(errors).length)
      return res.status(400).json({ message: 'Validasi gagal', errors });

    const hash = await bcrypt.hash(password, 10);
    try {
      const [r] = await db.query(
        'INSERT INTO `user` (nama, email, password) VALUES (?, ?, ?)',
        [nama, email, hash]
      );
      const user = { id_user: r.insertId, nama, email };
      res.status(201).json({ message: 'Akun berhasil dibuat', token: buatToken(user), user });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res
          .status(409)
          .json({ message: 'Email sudah digunakan', errors: { email: 'Email sudah digunakan' } });
      throw err;
    }
  })
);

// US-02 Login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password)
      return res.status(400).json({ message: 'Email dan password wajib diisi' });

    const [rows] = await db.query('SELECT * FROM `user` WHERE email = ?', [email]);
    const u = rows[0];
    const cocok = u && (await bcrypt.compare(password, u.password));
    if (!cocok) return res.status(401).json({ message: 'Email atau password salah' });

    const user = { id_user: u.id_user, nama: u.nama, email: u.email };
    res.json({ message: 'Login berhasil', token: buatToken(user), user });
  })
);

// Cek sesi / ambil data akun sendiri
router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      'SELECT id_user, nama, email, tanggal_daftar FROM `user` WHERE id_user = ?',
      [req.user.id_user]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Akun tidak ditemukan' });
    res.json(rows[0]);
  })
);

module.exports = router;
