const express = require('express');
const db = require('../config/db');
const { asyncHandler, fotoUrl } = require('../utils');

const router = express.Router();

// US-10: profil pembuat resep + daftar resepnya
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      'SELECT id_user, nama, tanggal_daftar FROM `user` WHERE id_user = ?', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });

    const [resep] = await db.query(
      `SELECT r.id_resep, r.nama_resep, r.foto, r.tanggal_dibuat,
              COALESCE(ROUND(AVG(rt.skor_rating), 1), 0) AS rata_rating
       FROM resep r LEFT JOIN rating rt ON rt.id_resep = r.id_resep
       WHERE r.id_user = ?
       GROUP BY r.id_resep, r.nama_resep, r.foto, r.tanggal_dibuat
       ORDER BY r.tanggal_dibuat DESC`,
      [id]
    );
    res.json({
      ...rows[0],
      jumlah_resep: resep.length,
      resep: resep.map((r) => ({ ...r, rata_rating: Number(r.rata_rating), foto: fotoUrl(req, r.foto) })),
    });
  })
);

module.exports = router;
