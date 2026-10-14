const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { auth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { asyncHandler, fotoUrl, parseBahan, simpanBahan } = require('../utils');

const router = express.Router();

// ---------- Query dasar daftar resep ----------
const BASE_SELECT = `
  SELECT r.id_resep, r.nama_resep, r.foto, r.tanggal_dibuat,
         u.id_user, u.nama AS nama_pembuat,
         k.id_kategori, k.nama_kategori,
         COALESCE(ROUND(AVG(rt.skor_rating), 1), 0) AS rata_rating,
         COUNT(DISTINCT rt.id_rating) AS jumlah_rating
  FROM resep r
  JOIN \`user\` u ON u.id_user = r.id_user
  JOIN kategori k ON k.id_kategori = r.id_kategori
  LEFT JOIN rating rt ON rt.id_resep = r.id_resep`;
const GROUP_BY = ' GROUP BY r.id_resep, u.id_user, u.nama, k.id_kategori, k.nama_kategori';

const mapResep = (req, r) => ({ ...r, rata_rating: Number(r.rata_rating), foto: fotoUrl(req, r.foto) });

const hapusFile = (nama) => {
  if (!nama) return;
  fs.unlink(path.join(upload.uploadDir, nama), () => {});
};

// US-05 + US-06: daftar & pencarian
// GET /api/resep?q=nasi&kategori=1 (atau nama kategori)&bahan=tempe&page=1&limit=20
// "q" mencocokkan nama resep ATAU nama bahan (cocok untuk satu kolom pencarian di app)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, kategori, bahan } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
    const where = [];
    const params = [];
    const adaBahan = `EXISTS (SELECT 1 FROM resep_bahan rb JOIN bahan b ON b.id_bahan = rb.id_bahan
                              WHERE rb.id_resep = r.id_resep AND b.nama_bahan LIKE ?)`;

    if (q) {
      where.push(`(r.nama_resep LIKE ? OR ${adaBahan})`);
      params.push(`%${q}%`, `%${q}%`);
    }
    if (kategori) {
      where.push(/^\d+$/.test(kategori) ? 'k.id_kategori = ?' : 'k.nama_kategori = ?');
      params.push(kategori);
    }
    if (bahan) {
      where.push(adaBahan);
      params.push(`%${bahan}%`);
    }

    const sql =
      BASE_SELECT +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      GROUP_BY +
      ' ORDER BY r.tanggal_dibuat DESC LIMIT ? OFFSET ?';
    const [rows] = await db.query(sql, [...params, limit, (page - 1) * limit]);
    res.json({ page, limit, data: rows.map((r) => mapResep(req, r)) });
  })
);

// US-12: resep populer
router.get(
  '/populer',
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      BASE_SELECT + GROUP_BY + ' ORDER BY rata_rating DESC, jumlah_rating DESC, r.tanggal_dibuat DESC LIMIT 20'
    );
    res.json(rows.map((r) => mapResep(req, r)));
  })
);

// US-14: resep yang pernah saya unggah
router.get(
  '/saya',
  auth,
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      BASE_SELECT + ' WHERE r.id_user = ?' + GROUP_BY + ' ORDER BY r.tanggal_dibuat DESC',
      [req.user.id_user]
    );
    res.json(rows.map((r) => mapResep(req, r)));
  })
);

// US-05 kriteria 3: detail resep (login opsional -> ikut mengirim rating & favorit milik user)
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.query(BASE_SELECT + ' WHERE r.id_resep = ?' + GROUP_BY, [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Resep tidak ditemukan' });

    const [bahan] = await db.query(
      `SELECT b.id_bahan, b.nama_bahan, rb.jumlah, rb.satuan
       FROM resep_bahan rb JOIN bahan b ON b.id_bahan = rb.id_bahan
       WHERE rb.id_resep = ? ORDER BY rb.id_resep_bahan`,
      [id]
    );
    const [[detail]] = await db.query(
      `SELECT r.langkah,
              (SELECT COUNT(*) FROM komentar WHERE id_resep = r.id_resep) AS jumlah_komentar
       FROM resep r WHERE r.id_resep = ?`,
      [id]
    );

    const hasil = {
      ...mapResep(req, rows[0]),
      langkah: detail.langkah,
      jumlah_komentar: detail.jumlah_komentar,
      bahan: bahan.map((b) => ({ ...b, jumlah: Number(b.jumlah) })),
      rating_saya: null,
      is_favorit: false,
      milik_saya: false,
    };

    if (req.user) {
      const uid = req.user.id_user;
      const [[rt]] = await db.query(
        'SELECT skor_rating FROM rating WHERE id_user = ? AND id_resep = ?', [uid, id]);
      const [[fv]] = await db.query(
        'SELECT 1 AS ada FROM favorit WHERE id_user = ? AND id_resep = ?', [uid, id]);
      hasil.rating_saya = rt ? rt.skor_rating : null;
      hasil.is_favorit = !!fv;
      hasil.milik_saya = rows[0].id_user === uid;
    }
    res.json(hasil);
  })
);

// US-03 + US-04: unggah resep (multipart/form-data, field foto opsional)
// Field: nama_resep, id_kategori, langkah, bahan (JSON string), foto (file)
router.post(
  '/',
  auth,
  upload.single('foto'),
  asyncHandler(async (req, res) => {
    const nama_resep = String(req.body.nama_resep || '').trim();
    const langkah = String(req.body.langkah || '').trim();
    const id_kategori = Number(req.body.id_kategori);
    const bahan = parseBahan(req.body.bahan);
    const foto = req.file ? req.file.filename : null;

    const errors = {};
    if (!nama_resep) errors.nama_resep = 'Nama resep wajib diisi';
    if (!langkah) errors.langkah = 'Langkah pembuatan wajib diisi';
    if (!id_kategori) errors.id_kategori = 'Kategori wajib dipilih';
    if (bahan === 'invalid' || !bahan || !bahan.length)
      errors.bahan = 'Minimal 1 bahan dengan nama, jumlah, dan satuan yang valid';
    if (Object.keys(errors).length) {
      hapusFile(foto);
      return res.status(400).json({ message: 'Validasi gagal', errors });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query(
        'INSERT INTO resep (id_user, id_kategori, nama_resep, langkah, foto) VALUES (?, ?, ?, ?, ?)',
        [req.user.id_user, id_kategori, nama_resep, langkah, foto]
      );
      await simpanBahan(conn, r.insertId, bahan);
      await conn.commit();
      res.status(201).json({ message: 'Resep berhasil diunggah', id_resep: r.insertId });
    } catch (err) {
      await conn.rollback();
      hapusFile(foto);
      throw err;
    } finally {
      conn.release();
    }
  })
);

// US-11: edit resep (hanya pemilik). Semua field opsional.
router.put(
  '/:id',
  auth,
  upload.single('foto'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const fotoBaru = req.file ? req.file.filename : null;

    const [rows] = await db.query('SELECT * FROM resep WHERE id_resep = ?', [id]);
    if (!rows[0]) {
      hapusFile(fotoBaru);
      return res.status(404).json({ message: 'Resep tidak ditemukan' });
    }
    if (rows[0].id_user !== req.user.id_user) {
      hapusFile(fotoBaru);
      return res.status(403).json({ message: 'Kamu hanya bisa mengedit resep milikmu sendiri' });
    }

    const bahan = parseBahan(req.body.bahan);
    if (bahan === 'invalid' || (Array.isArray(bahan) && !bahan.length)) {
      hapusFile(fotoBaru);
      return res.status(400).json({ message: 'Data bahan tidak valid' });
    }

    const sets = [];
    const vals = [];
    if (req.body.nama_resep !== undefined) {
      const v = String(req.body.nama_resep).trim();
      if (!v) { hapusFile(fotoBaru); return res.status(400).json({ message: 'Nama resep tidak boleh kosong' }); }
      sets.push('nama_resep = ?'); vals.push(v);
    }
    if (req.body.langkah !== undefined) {
      const v = String(req.body.langkah).trim();
      if (!v) { hapusFile(fotoBaru); return res.status(400).json({ message: 'Langkah tidak boleh kosong' }); }
      sets.push('langkah = ?'); vals.push(v);
    }
    if (req.body.id_kategori !== undefined) {
      sets.push('id_kategori = ?'); vals.push(Number(req.body.id_kategori));
    }
    if (fotoBaru) { sets.push('foto = ?'); vals.push(fotoBaru); }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      if (sets.length) await conn.query(`UPDATE resep SET ${sets.join(', ')} WHERE id_resep = ?`, [...vals, id]);
      if (bahan) {
        await conn.query('DELETE FROM resep_bahan WHERE id_resep = ?', [id]);
        await simpanBahan(conn, id, bahan);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      hapusFile(fotoBaru);
      throw err;
    } finally {
      conn.release();
    }

    if (fotoBaru) hapusFile(rows[0].foto); // hapus foto lama
    res.json({ message: 'Resep berhasil diperbarui' });
  })
);

// US-11: hapus resep (hanya pemilik)
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.query('SELECT id_user, foto FROM resep WHERE id_resep = ?', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Resep tidak ditemukan' });
    if (rows[0].id_user !== req.user.id_user)
      return res.status(403).json({ message: 'Kamu hanya bisa menghapus resep milikmu sendiri' });

    await db.query('DELETE FROM resep WHERE id_resep = ?', [id]);
    hapusFile(rows[0].foto);
    res.json({ message: 'Resep berhasil dihapus' });
  })
);

module.exports = router;
