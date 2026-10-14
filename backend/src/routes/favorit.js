const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { asyncHandler, fotoUrl } = require('../utils');

const router = express.Router();

// US-09 kriteria 2: koleksi resep favorit milik user yang login
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      `SELECT r.id_resep, r.nama_resep, r.foto, r.langkah, k.nama_kategori,
              u.nama AS nama_pembuat, f.tanggal_favorit
       FROM favorit f
       JOIN resep r ON r.id_resep = f.id_resep
       JOIN kategori k ON k.id_kategori = r.id_kategori
       JOIN \`user\` u ON u.id_user = r.id_user
       WHERE f.id_user = ? ORDER BY f.tanggal_favorit DESC`,
      [req.user.id_user]
    );

    // Sertakan bahan supaya bisa disimpan penuh untuk mode offline di aplikasi
    const ids = rows.map((r) => r.id_resep);
    let bahanMap = {};
    if (ids.length) {
      const [bahan] = await db.query(
        `SELECT rb.id_resep, b.nama_bahan, rb.jumlah, rb.satuan
         FROM resep_bahan rb JOIN bahan b ON b.id_bahan = rb.id_bahan
         WHERE rb.id_resep IN (?)`,
        [ids]
      );
      for (const b of bahan) {
        (bahanMap[b.id_resep] = bahanMap[b.id_resep] || []).push({
          nama_bahan: b.nama_bahan, jumlah: Number(b.jumlah), satuan: b.satuan,
        });
      }
    }
    res.json(rows.map((r) => ({ ...r, foto: fotoUrl(req, r.foto), bahan: bahanMap[r.id_resep] || [] })));
  })
);

module.exports = router;
