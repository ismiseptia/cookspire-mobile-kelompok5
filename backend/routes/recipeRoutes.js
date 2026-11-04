const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Ambil Semua Resep (Mendukung Filter Kategori & Pencarian)
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    
    let sql = `
      SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        k.nama_kategori AS category,
        u.nama AS author,
        r.foto AS icon,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN user u ON r.id_user = u.id_user
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE 1=1
    `;
    
    const params = [];

    if (search) {
      sql += ' AND (r.nama_resep LIKE ? OR k.nama_kategori LIKE ? OR u.nama LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'Semua') {
      sql += ' AND k.nama_kategori = ?';
      params.push(category);
    }

    sql += ' GROUP BY r.id_resep ORDER BY r.tanggal_dibuat DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error Get Recipes:', error);
    res.status(500).json({ message: 'Gagal mengambil data resep.' });
  }
});

// 2. Ambil Resep Populer (Menggunakan View v_resep_populer)
router.get('/populer', async (req, res) => {
  try {
    const sql = `
      SELECT 
        vp.id_resep AS id,
        vp.nama_resep AS title,
        vp.foto AS icon,
        u.nama AS author,
        COALESCE(vp.rata_rating, 0.0) AS rating,
        COALESCE(vp.jumlah_komentar, 0) AS reviews_count
      FROM v_resep_populer vp
      LEFT JOIN user u ON vp.id_user = u.id_user
      LIMIT 10
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    console.error('Error Get Popular Recipes:', error);
    res.status(500).json({ message: 'Gagal mengambil resep populer.' });
  }
});

// 3. Ambil Detail Resep Berdasarkan ID (Dengan Gelar Penulis Dinamis)
router.get('/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;

    // Query Utama dengan menghitung total resep milik penulis
    const [recipes] = await db.query(`
      SELECT 
        r.id_resep AS id,
        r.id_user AS author_id,
        r.nama_resep AS title,
        k.nama_kategori AS category,
        u.nama AS author,
        (SELECT COUNT(*) FROM resep WHERE id_user = r.id_user) AS total_author_recipes,
        r.foto AS icon,
        r.langkah,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN user u ON r.id_user = u.id_user
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE r.id_resep = ?
      GROUP BY r.id_resep
    `, [recipeId]);

    if (recipes.length === 0) {
      return res.status(404).json({ message: 'Resep tidak ditemukan' });
    }

    const [ingredientsRaw] = await db.query(`
      SELECT 
        b.nama_bahan AS name,
        rb.jumlah,
        rb.satuan
      FROM resep_bahan rb
      JOIN bahan b ON rb.id_bahan = b.id_bahan
      WHERE rb.id_resep = ?
    `, [recipeId]);

    const ingredients = ingredientsRaw.map((item) => {
      const cleanNum = parseFloat(item.jumlah);
      const amountStr = isNaN(cleanNum) ? item.jumlah : cleanNum.toString();
      const unitStr = item.satuan ? item.satuan.trim() : '';
      return {
        name: item.name,
        qty: unitStr ? `${amountStr} ${unitStr}` : amountStr,
      };
    });

    const recipeData = recipes[0];
    const totalRecipes = recipeData.total_author_recipes || 0;

    // Tentukan gelar/peran penulis secara dinamis berdasarkan jumlah resep
    let authorRole = 'Chef Amatir';
    if (totalRecipes >= 10) {
      authorRole = 'Master Chef';
    } else if (totalRecipes >= 5) {
      authorRole = 'Koki Handal';
    } else if (totalRecipes >= 2) {
      authorRole = 'Hobi Masak';
    }

    const stepsArray = recipeData.langkah 
      ? recipeData.langkah.split('\n').filter(step => step.trim() !== '')
      : [];

    res.json({
      ...recipeData,
      author_role: authorRole,
      time_minutes: 30,
      level: 'Mudah',
      ingredients,
      steps: stepsArray,
    });
  } catch (error) {
    console.error('Error Get Recipe Detail:', error);
    res.status(500).json({ message: 'Gagal mengambil detail resep.' });
  }
});

// 4. Ambil Ulasan & Rating Resep
router.get('/:id/reviews', async (req, res) => {
  try {
    const recipeId = req.params.id;

    const [rows] = await db.query(`
      SELECT 
        k.id_komentar AS id,
        u.nama AS author,
        k.teks_komentar AS comment,
        k.tanggal_komentar,
        COALESCE(rt.skor_rating, 5) AS rating
      FROM komentar k
      JOIN user u ON k.id_user = u.id_user
      LEFT JOIN rating rt ON k.id_resep = rt.id_resep AND k.id_user = rt.id_user
      WHERE k.id_resep = ?
      ORDER BY k.tanggal_komentar DESC
    `, [recipeId]);

    res.json(rows);
  } catch (error) {
    console.error('Error Get Reviews:', error);
    res.status(500).json({ message: 'Gagal mengambil ulasan.' });
  }
});

// 5. Tambah Komentar & Rating Baru
router.post('/:id/reviews', async (req, res) => {
  try {
    const recipeId = req.params.id;
    const { id_user, rating, comment } = req.body;
    const userId = id_user || 1;

    if (comment && comment.trim() !== '') {
      await db.query(`
        INSERT INTO komentar (id_user, id_resep, teks_komentar, tanggal_komentar)
        VALUES (?, ?, ?, NOW())
      `, [userId, recipeId, comment]);
    }

    if (rating) {
      await db.query(`
        INSERT INTO rating (id_user, id_resep, skor_rating, tanggal_rating)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE skor_rating = ?, tanggal_rating = NOW()
      `, [userId, recipeId, rating, rating]);
    }

    res.status(201).json({ message: 'Ulasan berhasil ditambahkan!' });
  } catch (error) {
    console.error('Error Post Review:', error);
    res.status(500).json({ message: 'Gagal menambahkan ulasan.' });
  }
});

// 6. Buat Resep Baru
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id_user, nama_resep, id_kategori, foto, ingredients, steps } = req.body;
    const userId = id_user || 1;

    const langkahText = Array.isArray(steps) ? steps.join('\n') : steps;

    const [recipeResult] = await connection.query(
      `INSERT INTO resep (id_user, id_kategori, nama_resep, langkah, foto, tanggal_dibuat)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, id_kategori || 1, nama_resep, langkahText, foto || '🥘']
    );

    const recipeId = recipeResult.insertId;

    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        if (!ing.name || !ing.name.trim()) continue;

        let [existingBahan] = await connection.query(
          'SELECT id_bahan FROM bahan WHERE LOWER(nama_bahan) = LOWER(?)',
          [ing.name.trim()]
        );

        let bahanId;
        if (existingBahan.length > 0) {
          bahanId = existingBahan[0].id_bahan;
        } else {
          const [newBahan] = await connection.query(
            'INSERT INTO bahan (nama_bahan) VALUES (?)',
            [ing.name.trim()]
          );
          bahanId = newBahan.insertId;
        }

        await connection.query(
          `INSERT INTO resep_bahan (id_resep, id_bahan, jumlah, satuan)
           VALUES (?, ?, ?, ?)`,
          [recipeId, bahanId, ing.jumlah || 1, ing.satuan || 'secukupnya']
        );
      }
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Resep berhasil dibuat!',
      id_resep: recipeId,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error Create Recipe:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah resep.' });
  } finally {
    connection.release();
  }
});

// 7. Ambil Resep Milik User
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const [recipes] = await db.query(
      `SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        k.nama_kategori AS category,
        r.foto AS icon,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE r.id_user = ?
      GROUP BY r.id_resep
      ORDER BY r.tanggal_dibuat DESC`,
      [userId]
    );

    const [stats] = await db.query(
      `SELECT 
        COUNT(DISTINCT r.id_resep) AS total_resep,
        COUNT(DISTINCT km.id_komentar) AS total_ulasan,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS avg_rating
      FROM resep r
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      WHERE r.id_user = ?`,
      [userId]
    );

    res.json({
      recipes,
      stats: stats[0] || { total_resep: 0, total_ulasan: 0, avg_rating: 0.0 },
    });
  } catch (error) {
    console.error('Error Get User Recipes:', error);
    res.status(500).json({ message: 'Gagal mengambil resep user.' });
  }
});

// 8. Hapus Resep
router.delete('/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;
    await db.query('DELETE FROM resep WHERE id_resep = ?', [recipeId]);
    res.json({ success: true, message: 'Resep berhasil dihapus.' });
  } catch (error) {
    console.error('Error Delete Recipe:', error);
    res.status(500).json({ message: 'Gagal menghapus resep.' });
  }
});

// 9. Update Resep
router.put('/:id', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const recipeId = req.params.id;
    const { nama_resep, id_kategori, foto, steps } = req.body;

    const langkahText = Array.isArray(steps) ? steps.join('\n') : steps;

    await connection.query(
      `UPDATE resep 
       SET nama_resep = ?, id_kategori = ?, foto = ?, langkah = ?
       WHERE id_resep = ?`,
      [nama_resep, id_kategori || 1, foto || '🥘', langkahText, recipeId]
    );

    await connection.commit();
    res.json({ success: true, message: 'Resep berhasil diperbarui!' });
  } catch (error) {
    await connection.rollback();
    console.error('Error Update Recipe:', error);
    res.status(500).json({ message: 'Gagal memperbarui resep.' });
  } finally {
    connection.release();
  }
});

// 10. Ambil Resep Favorit User
router.get('/favorites/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { category } = req.query;

    let sql = `
      SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        k.nama_kategori AS category,
        u.nama AS author,
        r.foto AS icon,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM favorit f
      JOIN resep r ON f.id_resep = r.id_resep
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN user u ON r.id_user = u.id_user
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE f.id_user = ?
    `;

    const params = [userId];

    if (category && category !== 'Semua') {
      sql += ' AND k.nama_kategori = ?';
      params.push(category);
    }

    sql += ' GROUP BY r.id_resep ORDER BY f.tanggal_favorit DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error Get Favorites:', error);
    res.status(500).json({ message: 'Gagal mengambil resep favorit.' });
  }
});

// 11. Toggle Favorit
router.post('/favorites/toggle', async (req, res) => {
  try {
    const { id_user, id_resep } = req.body;
    const userId = id_user || 1;

    const [existing] = await db.query(
      'SELECT * FROM favorit WHERE id_user = ? AND id_resep = ?',
      [userId, id_resep]
    );

    if (existing.length > 0) {
      await db.query('DELETE FROM favorit WHERE id_user = ? AND id_resep = ?', [userId, id_resep]);
      return res.json({ isFavorite: false, message: 'Dihapus dari favorit.' });
    } else {
      await db.query(
        'INSERT INTO favorit (id_user, id_resep, tanggal_favorit) VALUES (?, ?, NOW())',
        [userId, id_resep]
      );
      return res.json({ isFavorite: true, message: 'Ditambahkan ke favorit.' });
    }
  } catch (error) {
    console.error('Error Toggle Favorite:', error);
    res.status(500).json({ message: 'Gagal memproses favorit.' });
  }
});

// 12. Notifikasi User
router.get('/notifications/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const [rows] = await db.query(`
      SELECT 
        n.id_notifikasi AS id,
        n.tipe,
        n.sudah_dibaca,
        n.tanggal,
        u.nama AS pengirim_nama,
        r.nama_resep,
        r.id_resep
      FROM notifikasi n
      JOIN user u ON n.id_pengirim = u.id_user
      JOIN resep r ON n.id_resep = r.id_resep
      WHERE n.id_user = ?
      ORDER BY n.tanggal DESC
    `, [userId]);

    res.json(rows);
  } catch (error) {
    console.error('Error Get Notifications:', error);
    res.status(500).json({ message: 'Gagal mengambil notifikasi.' });
  }
});

// 13. Profil Pembuat Resep
router.get('/user-profile/:authorId', async (req, res) => {
  try {
    const authorId = req.params.authorId;

    const [userRows] = await db.query(
      'SELECT id_user, nama, email, tanggal_daftar FROM user WHERE id_user = ?',
      [authorId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    const [recipes] = await db.query(`
      SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        k.nama_kategori AS category,
        r.foto AS icon,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE r.id_user = ?
      GROUP BY r.id_resep
      ORDER BY r.tanggal_dibuat DESC
    `, [authorId]);

    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT r.id_resep) AS total_resep,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS avg_rating,
        COUNT(DISTINCT f.id_favorit) AS total_favorit
      FROM resep r
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN favorit f ON r.id_resep = f.id_resep
      WHERE r.id_user = ?
    `, [authorId]);

    res.json({
      user: userRows[0],
      recipes,
      stats: stats[0] || { total_resep: 0, avg_rating: '0.0', total_favorit: 0 },
    });
  } catch (error) {
    console.error('Error Get Author Profile:', error);
    res.status(500).json({ message: 'Gagal mengambil profil pembuat.' });
  }
});

module.exports = router;