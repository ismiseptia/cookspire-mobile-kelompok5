const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../utils');

const router = express.Router();

async function ambilResep(id) {
  const [rows] = await db.query('SELECT id_resep, id_user FROM resep WHERE id_resep = ?', [id]);
  return rows[0];
}

// Buat notifikasi untuk pemilik resep (US-13), kecuali dia sendiri yang berinteraksi
async function notifPemilik(resep, idPengirim, tipe) {
  if (resep.id_user === idPengirim) return;
  await db.query(
    'INSERT INTO notifikasi (id_user, id_resep, id_pengirim, tipe) VALUES (?, ?, ?, ?)',
    [resep.id_user, resep.id_resep, idPengirim, tipe]
  );
}

// US-07: beri / ubah rating (1 user = 1 rating per resep)
router.post(
  '/:id/rating',
  auth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const skor = Number(req.body.skor_rating);
    if (!Number.isInteger(skor) || skor < 1 || skor > 5)
      return res.status(400).json({ message: 'Rating harus bilangan bulat 1 sampai 5' });

    const resep = await ambilResep(id);
    if (!resep) return res.status(404).json({ message: 'Resep tidak ditemukan' });

    const [r] = await db.query(
      `INSERT INTO rating (id_user, id_resep, skor_rating) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE skor_rating = VALUES(skor_rating), tanggal_rating = NOW()`,
      [req.user.id_user, id, skor]
    );
    if (r.affectedRows === 1) await notifPemilik(resep, req.user.id_user, 'rating'); // rating baru

    const [[stat]] = await db.query(
      `SELECT ROUND(AVG(skor_rating), 1) AS rata_rating, COUNT(*) AS jumlah_rating
       FROM rating WHERE id_resep = ?`, [id]);
    res.json({
      message: 'Rating tersimpan',
      rating_saya: skor,
      rata_rating: Number(stat.rata_rating),
      jumlah_rating: stat.jumlah_rating,
    });
  })
);

// US-08: daftar komentar
router.get(
  '/:id/komentar',
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      `SELECT k.id_komentar, k.teks_komentar, k.tanggal_komentar, u.id_user, u.nama AS nama_user
       FROM komentar k JOIN \`user\` u ON u.id_user = k.id_user
       WHERE k.id_resep = ? ORDER BY k.tanggal_komentar DESC`,
      [Number(req.params.id)]
    );
    res.json(rows);
  })
);

// US-08: kirim komentar
router.post(
  '/:id/komentar',
  auth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const teks = String(req.body.teks_komentar || '').trim();
    if (!teks) return res.status(400).json({ message: 'Komentar tidak boleh kosong' });

    const resep = await ambilResep(id);
    if (!resep) return res.status(404).json({ message: 'Resep tidak ditemukan' });

    const [r] = await db.query(
      'INSERT INTO komentar (id_user, id_resep, teks_komentar) VALUES (?, ?, ?)',
      [req.user.id_user, id, teks]
    );
    await notifPemilik(resep, req.user.id_user, 'komentar');
    res.status(201).json({ message: 'Komentar terkirim', id_komentar: r.insertId });
  })
);

// US-09: toggle favorit (tekan lagi = hapus dari favorit)
router.post(
  '/:id/favorit',
  auth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const resep = await ambilResep(id);
    if (!resep) return res.status(404).json({ message: 'Resep tidak ditemukan' });

    const [ada] = await db.query(
      'SELECT id_favorit FROM favorit WHERE id_user = ? AND id_resep = ?',
      [req.user.id_user, id]
    );
    if (ada[0]) {
      await db.query('DELETE FROM favorit WHERE id_favorit = ?', [ada[0].id_favorit]);
      return res.json({ message: 'Dihapus dari favorit', is_favorit: false });
    }
    await db.query('INSERT INTO favorit (id_user, id_resep) VALUES (?, ?)', [req.user.id_user, id]);
    res.status(201).json({ message: 'Ditambahkan ke favorit', is_favorit: true });
  })
);

module.exports = router;
