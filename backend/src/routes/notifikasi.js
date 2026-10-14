const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../utils');

const router = express.Router();

// US-13: daftar notifikasi komentar / rating baru
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      `SELECT n.id_notifikasi, n.tipe, n.sudah_dibaca, n.tanggal,
              r.id_resep, r.nama_resep, u.nama AS nama_pengirim
       FROM notifikasi n
       JOIN resep r ON r.id_resep = n.id_resep
       JOIN \`user\` u ON u.id_user = n.id_pengirim
       WHERE n.id_user = ? ORDER BY n.tanggal DESC LIMIT 100`,
      [req.user.id_user]
    );
    const belumDibaca = rows.filter((n) => !n.sudah_dibaca).length;
    res.json({ belum_dibaca: belumDibaca, data: rows });
  })
);

// Tandai semua sudah dibaca
router.patch(
  '/baca',
  auth,
  asyncHandler(async (req, res) => {
    await db.query('UPDATE notifikasi SET sudah_dibaca = 1 WHERE id_user = ?', [req.user.id_user]);
    res.json({ message: 'Semua notifikasi ditandai sudah dibaca' });
  })
);

module.exports = router;
