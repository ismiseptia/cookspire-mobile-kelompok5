const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const VALID_LEVELS = ['Mudah', 'Sedang', 'Sulit'];

// Helper: Normalisasi input waktu memasak (menit) & tingkat kesulitan
const normalizeRecipeMeta = (body = {}) => {
  const rawTime = parseInt(body.waktu_memasak ?? body.time_minutes, 10);
  const waktuMemasak = Number.isFinite(rawTime) && rawTime > 0 ? rawTime : 30;

  const rawLevel = String(body.tingkat_kesulitan ?? body.level ?? 'Mudah').trim();
  const tingkatKesulitan =
    VALID_LEVELS.find((lvl) => lvl.toLowerCase() === rawLevel.toLowerCase()) || 'Mudah';

  return { waktuMemasak, tingkatKesulitan };
};

// Helper: Tentukan gelar penulis berdasarkan total resep
const getAuthorRole = (totalRecipes = 0) => {
  if (totalRecipes >= 10) return 'Master Chef';
  if (totalRecipes >= 5) return 'Koki Handal';
  if (totalRecipes >= 2) return 'Hobi Masak';
  return 'Chef Amatir';
};

// Helper: Cari atau buat bahan baru di dalam transaksi database
const resolveIngredientId = async (connection, rawName) => {
  const cleanName = rawName.trim();
  const [existing] = await connection.query(
    'SELECT id_bahan FROM bahan WHERE LOWER(nama_bahan) = LOWER(?)',
    [cleanName]
  );

  if (existing.length > 0) {
    return existing[0].id_bahan;
  }

  const [inserted] = await connection.query(
    'INSERT INTO bahan (nama_bahan) VALUES (?)',
    [cleanName]
  );
  return inserted.insertId;
};

// Helper: Simpan daftar bahan untuk resep tertentu
const syncRecipeIngredients = async (connection, recipeId, ingredients = []) => {
  for (const ing of ingredients) {
    if (!ing?.name || !ing.name.trim()) continue;

    const bahanId = await resolveIngredientId(connection, ing.name);
    await connection.query(
      `INSERT INTO resep_bahan (id_resep, id_bahan, jumlah, satuan)
       VALUES (?, ?, ?, ?)`,
      [recipeId, bahanId, ing.jumlah || 1, ing.satuan || 'secukupnya']
    );
  }
};

// Helper: Pecah input pencarian bahan "tempe, tahu  bawang putih" -> ['tempe','tahu','bawang putih']
// Pemisah utama koma; tanpa koma dianggap satu bahan (agar "bawang putih" tidak terpecah).
const parseIngredientTerms = (raw = '') =>
  String(raw)
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);

// Helper: Escape karakter wildcard LIKE agar input "%" atau "_" dicari apa adanya
const escapeLike = (text) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

// Helper: Buat notifikasi untuk pemilik resep (tidak membuat notifikasi untuk aksi diri sendiri)
const createNotification = async (connection, { recipeId, senderId, tipe }) => {
  const [rows] = await connection.query(
    'SELECT id_user FROM resep WHERE id_resep = ? AND deleted_at IS NULL',
    [recipeId]
  );
  if (rows.length === 0) return;
  const ownerId = rows[0].id_user;
  if (String(ownerId) === String(senderId)) return;

  await connection.query(
    `INSERT INTO notifikasi (id_user, id_resep, id_pengirim, tipe, sudah_dibaca, tanggal)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [ownerId, recipeId, senderId, tipe]
  );
};

// 1. Ambil Semua Resep (Mendukung Filter Kategori & Pencarian)
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    // type: 'nama' | 'kategori' | 'bahan'. Tanpa type = cari di semua (nama, kategori, penulis, bahan)
    const type = String(req.query.type || '').toLowerCase();

    const selectParams = [];
    const whereParams = [];

    // Kolom hitung kecocokan bahan (dipakai untuk mengurutkan: yang paling banyak cocok di atas)
    let matchSelect = '0 AS matched_count';
    let ingredientFilter = '';
    const terms = type === 'bahan' || !type ? parseIngredientTerms(search) : [];

    if (terms.length > 0) {
      const likeClause = terms.map(() => 'b.nama_bahan LIKE ?').join(' OR ');
      const likeValues = terms.map((t) => `%${escapeLike(t)}%`);

      matchSelect = `(
        SELECT COUNT(DISTINCT b.id_bahan)
        FROM resep_bahan rb JOIN bahan b ON b.id_bahan = rb.id_bahan
        WHERE rb.id_resep = r.id_resep AND (${likeClause})
      ) AS matched_count`;
      selectParams.push(...likeValues);

      ingredientFilter = `r.id_resep IN (
        SELECT rb.id_resep FROM resep_bahan rb JOIN bahan b ON b.id_bahan = rb.id_bahan
        WHERE ${likeClause}
      )`;
      whereParams.push(...likeValues);
    }

    let sql = `
      SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        MAX(k.nama_kategori) AS category,
        MAX(u.nama) AS author,
        MAX(r.id_user) AS author_id,
        MAX(u.foto) AS author_photo,
        MAX(r.foto) AS icon,
        COALESCE(MAX(r.waktu_memasak), 30) AS time_minutes,
        COALESCE(MAX(r.tingkat_kesulitan), 'Mudah') AS level,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count,
        ${matchSelect}
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN user u ON r.id_user = u.id_user
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE r.deleted_at IS NULL
    `;

    const params = [...selectParams];

    if (search && String(search).trim()) {
      const term = `%${escapeLike(String(search).trim())}%`;

      if (type === 'nama') {
        sql += ' AND r.nama_resep LIKE ?';
        whereParams.push(term);
      } else if (type === 'kategori') {
        sql += ' AND k.nama_kategori LIKE ?';
        whereParams.push(term);
      } else if (type === 'bahan') {
        if (ingredientFilter) sql += ` AND ${ingredientFilter}`;
      } else {
        // Pencarian umum: judul, kategori, penulis, ATAU bahan
        sql += ` AND (r.nama_resep LIKE ? OR k.nama_kategori LIKE ? OR u.nama LIKE ?${
          ingredientFilter ? ` OR ${ingredientFilter}` : ''
        })`;
        // urutan placeholder: 3 LIKE pertama, lalu placeholder dari ingredientFilter
        whereParams.unshift(term, term, term);
      }
    }

    if (category && category !== 'Semua') {
      sql += ' AND k.nama_kategori = ?';
      whereParams.push(category);
    }

    sql += `
      GROUP BY r.id_resep, r.nama_resep, r.tanggal_dibuat
      ORDER BY matched_count DESC, r.tanggal_dibuat DESC
    `;

    const [rows] = await db.query(sql, [...params, ...whereParams]);
    res.json(rows);
  } catch (error) {
    console.error('Error Get Recipes:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal mengambil data resep.' });
  }
});

// 2. Ambil Resep Populer / Pilihan (Diurutkan dari Bintang Tertinggi)
router.get('/populer', async (req, res) => {
  try {
    const sql = `
      SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        MAX(k.nama_kategori) AS category,
        MAX(r.foto) AS icon,
        MAX(u.nama) AS author,
        MAX(r.id_user) AS author_id,
        MAX(u.foto) AS author_photo,
        COALESCE(MAX(r.waktu_memasak), 30) AS time_minutes,
        COALESCE(MAX(r.tingkat_kesulitan), 'Mudah') AS level,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN user u ON r.id_user = u.id_user
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE r.deleted_at IS NULL
      GROUP BY r.id_resep, r.nama_resep, r.tanggal_dibuat
      ORDER BY rating DESC, reviews_count DESC, r.tanggal_dibuat DESC
      LIMIT 10
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    console.error('Error Get Popular Recipes:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal mengambil resep populer.' });
  }
});

// 3. Ambil Resep Milik User
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [recipes] = await db.query(
      `SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        MAX(k.nama_kategori) AS category,
        MAX(r.foto) AS icon,
        COALESCE(MAX(r.waktu_memasak), 30) AS time_minutes,
        COALESCE(MAX(r.tingkat_kesulitan), 'Mudah') AS level,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE r.id_user = ? AND r.deleted_at IS NULL
      GROUP BY r.id_resep, r.nama_resep, r.tanggal_dibuat
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
      WHERE r.id_user = ? AND r.deleted_at IS NULL`,
      [userId]
    );

    res.json({
      recipes,
      stats: stats[0] || { total_resep: 0, total_ulasan: 0, avg_rating: 0.0 },
    });
  } catch (error) {
    console.error('Error Get User Recipes:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal mengambil resep user.' });
  }
});

// 4. Ambil Resep Favorit User
router.get('/favorites/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { category } = req.query;

    if (String(userId) !== String(req.user.id_user)) {
      return res.status(403).json({ message: 'Anda tidak boleh melihat favorit pengguna lain.' });
    }

    let sql = `
      SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        MAX(k.nama_kategori) AS category,
        MAX(u.nama) AS author,
        MAX(r.id_user) AS author_id,
        MAX(u.foto) AS author_photo,
        MAX(r.foto) AS icon,
        COALESCE(MAX(r.waktu_memasak), 30) AS time_minutes,
        COALESCE(MAX(r.tingkat_kesulitan), 'Mudah') AS level,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM favorit f
      JOIN resep r ON f.id_resep = r.id_resep
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN user u ON r.id_user = u.id_user
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE f.id_user = ? AND r.deleted_at IS NULL
    `;

    const params = [userId];

    if (category && category !== 'Semua') {
      sql += ' AND k.nama_kategori = ?';
      params.push(category);
    }

    sql += `
      GROUP BY r.id_resep, r.nama_resep, f.tanggal_favorit
      ORDER BY f.tanggal_favorit DESC
    `;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error Get Favorites:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal mengambil resep favorit.' });
  }
});

// 5. Toggle Favorit
router.post('/favorites/toggle', authenticate, async (req, res) => {
  try {
    const id_user = req.user.id_user;
    const { id_resep } = req.body;
    if (!id_resep) {
      return res.status(400).json({ message: 'ID resep tidak valid.' });
    }

    const [existing] = await db.query(
      'SELECT id_favorit FROM favorit WHERE id_user = ? AND id_resep = ?',
      [id_user, id_resep]
    );

    if (existing.length > 0) {
      await db.query('DELETE FROM favorit WHERE id_user = ? AND id_resep = ?', [id_user, id_resep]);
      return res.json({ isFavorite: false, message: 'Dihapus dari favorit.' });
    }

    await db.query(
      'INSERT INTO favorit (id_user, id_resep, tanggal_favorit) VALUES (?, ?, NOW())',
      [id_user, id_resep]
    );
    res.json({ isFavorite: true, message: 'Ditambahkan ke favorit.' });
  } catch (error) {
    console.error('Error Toggle Favorite:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal memproses favorit.' });
  }
});

// 6. Notifikasi User (WAJIB JWT: user diambil dari token, bukan dari URL)
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        n.id_notifikasi AS id,
        n.tipe,
        n.sudah_dibaca,
        n.tanggal,
        n.id_pengirim,
        u.nama AS pengirim_nama,
        u.foto AS pengirim_foto,
        r.nama_resep,
        r.id_resep
      FROM notifikasi n
      JOIN user u ON n.id_pengirim = u.id_user
      JOIN resep r ON n.id_resep = r.id_resep
      WHERE n.id_user = ? AND r.deleted_at IS NULL
      ORDER BY n.tanggal DESC
      LIMIT 100`,
      [req.user.id_user]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error Get Notifications:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal mengambil notifikasi.' });
  }
});

// 6b. Jumlah notifikasi belum dibaca (untuk badge)
router.get('/notifications/unread-count', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM notifikasi n JOIN resep r ON n.id_resep = r.id_resep
       WHERE n.id_user = ? AND n.sudah_dibaca = 0 AND r.deleted_at IS NULL`,
      [req.user.id_user]
    );
    res.json({ count: rows[0].total });
  } catch (error) {
    console.error('Error Unread Count:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal menghitung notifikasi.' });
  }
});

// 6c. Tandai semua notifikasi sudah dibaca
router.patch('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE notifikasi SET sudah_dibaca = 1 WHERE id_user = ?', [req.user.id_user]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error Read All Notifications:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal memperbarui notifikasi.' });
  }
});

// 6d. Tandai satu notifikasi sudah dibaca (hanya milik sendiri)
router.patch('/notifications/:notifId/read', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifikasi SET sudah_dibaca = 1 WHERE id_notifikasi = ? AND id_user = ?',
      [req.params.notifId, req.user.id_user]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error Read Notification:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal memperbarui notifikasi.' });
  }
});

// 6e. Riwayat resep yang dihapus (Sampah) milik user yang login
router.get('/trash', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        r.foto AS icon,
        r.deleted_at,
        k.nama_kategori AS category
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      WHERE r.id_user = ? AND r.deleted_at IS NOT NULL
      ORDER BY r.deleted_at DESC`,
      [req.user.id_user]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error Get Trash:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal mengambil riwayat resep terhapus.' });
  }
});

// 7. Profil Pembuat Resep
router.get('/user-profile/:authorId', async (req, res) => {
  try {
    const { authorId } = req.params;

    const [userRows] = await db.query(
      'SELECT id_user, nama, email, foto, tanggal_daftar FROM user WHERE id_user = ?',
      [authorId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    const [recipes] = await db.query(
      `SELECT 
        r.id_resep AS id,
        r.nama_resep AS title,
        MAX(k.nama_kategori) AS category,
        MAX(r.foto) AS icon,
        COALESCE(MAX(r.waktu_memasak), 30) AS time_minutes,
        COALESCE(MAX(r.tingkat_kesulitan), 'Mudah') AS level,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE r.id_user = ? AND r.deleted_at IS NULL
      GROUP BY r.id_resep, r.nama_resep, r.tanggal_dibuat
      ORDER BY r.tanggal_dibuat DESC`,
      [authorId]
    );

    const [stats] = await db.query(
      `SELECT 
        COUNT(DISTINCT r.id_resep) AS total_resep,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS avg_rating,
        COUNT(DISTINCT f.id_favorit) AS total_favorit
      FROM resep r
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN favorit f ON r.id_resep = f.id_resep
      WHERE r.id_user = ? AND r.deleted_at IS NULL`,
      [authorId]
    );

    res.json({
      user: userRows[0],
      recipes,
      stats: stats[0] || { total_resep: 0, avg_rating: '0.0', total_favorit: 0 },
    });
  } catch (error) {
    console.error('Error Get Author Profile:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal mengambil profil pembuat.' });
  }
});

// 8. Ambil Detail Resep Berdasarkan ID
router.get('/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;

    const [recipes] = await db.query(
      `SELECT 
        r.id_resep AS id,
        r.id_user AS author_id,
        r.id_kategori,
        r.nama_resep AS title,
        MAX(k.nama_kategori) AS category,
        MAX(u.nama) AS author,
        MAX(u.foto) AS author_photo,
        (SELECT COUNT(*) FROM resep WHERE id_user = r.id_user AND deleted_at IS NULL) AS total_author_recipes,
        MAX(r.foto) AS icon,
        MAX(r.langkah) AS langkah,
        COALESCE(MAX(r.waktu_memasak), 30) AS time_minutes,
        COALESCE(MAX(r.tingkat_kesulitan), 'Mudah') AS level,
        COALESCE(ROUND(AVG(rt.skor_rating), 1), 0.0) AS rating,
        COUNT(DISTINCT km.id_komentar) AS reviews_count
      FROM resep r
      LEFT JOIN kategori k ON r.id_kategori = k.id_kategori
      LEFT JOIN user u ON r.id_user = u.id_user
      LEFT JOIN rating rt ON r.id_resep = rt.id_resep
      LEFT JOIN komentar km ON r.id_resep = km.id_resep
      WHERE r.id_resep = ? AND r.deleted_at IS NULL
      GROUP BY r.id_resep, r.id_user, r.id_kategori, r.nama_resep`,
      [recipeId]
    );

    if (recipes.length === 0) {
      return res.status(404).json({ message: 'Resep tidak ditemukan' });
    }

    const [ingredientsRaw] = await db.query(
      `SELECT 
        b.nama_bahan AS name,
        rb.jumlah,
        rb.satuan
      FROM resep_bahan rb
      JOIN bahan b ON rb.id_bahan = b.id_bahan
      WHERE rb.id_resep = ?`,
      [recipeId]
    );

    const ingredients = ingredientsRaw.map((item) => {
      const cleanNum = parseFloat(item.jumlah);
      const amountStr = isNaN(cleanNum) ? item.jumlah : cleanNum.toString();
      const unitStr = item.satuan ? item.satuan.trim() : '';
      return {
        name: item.name,
        qty: unitStr ? `${amountStr} ${unitStr}` : amountStr,
        jumlah: amountStr,
        satuan: unitStr,
      };
    });

    const recipeData = recipes[0];
    const stepsArray = recipeData.langkah
      ? recipeData.langkah.split('\n').filter((step) => step.trim() !== '')
      : [];

    res.json({
      ...recipeData,
      author_role: getAuthorRole(recipeData.total_author_recipes),
      ingredients,
      steps: stepsArray,
    });
  } catch (error) {
    console.error('Error Get Recipe Detail:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal mengambil detail resep.' });
  }
});

// 9. Ambil Ulasan & Rating Resep
router.get('/:id/reviews', async (req, res) => {
  try {
    const recipeId = req.params.id;

    const [rows] = await db.query(
      `SELECT 
        k.id_komentar AS id,
        k.id_user,
        r.id_user AS recipe_author_id,
        (k.id_user = r.id_user) AS is_author,
        u.nama AS author,
        u.foto AS author_photo,
        k.teks_komentar AS comment,
        k.tanggal_komentar,
        CASE 
          WHEN k.id_user = r.id_user THEN rt.skor_rating 
          ELSE COALESCE(rt.skor_rating, 5) 
        END AS rating
      FROM komentar k
      JOIN resep r ON k.id_resep = r.id_resep
      JOIN user u ON k.id_user = u.id_user
      LEFT JOIN rating rt ON k.id_resep = rt.id_resep AND k.id_user = rt.id_user
      WHERE k.id_resep = ? AND r.deleted_at IS NULL
      ORDER BY k.tanggal_komentar DESC`,
      [recipeId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error Get Reviews:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal mengambil ulasan.' });
  }
});

// 10. Tambah Komentar & Rating Baru (JWT) + kirim notifikasi ke pemilik resep
router.post('/:id/reviews', authenticate, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const id_user = req.user.id_user;
    const { rating, comment } = req.body;

    const [recipeRows] = await db.query(
      'SELECT id_resep FROM resep WHERE id_resep = ? AND deleted_at IS NULL',
      [recipeId]
    );
    if (recipeRows.length === 0) {
      return res.status(404).json({ message: 'Resep tidak ditemukan.' });
    }

    const score = rating ? parseInt(rating, 10) : null;
    if (rating && (!Number.isInteger(score) || score < 1 || score > 5)) {
      return res.status(400).json({ message: 'Rating harus bernilai 1 sampai 5.' });
    }

    const hasComment = comment && comment.trim() !== '';

    if (hasComment) {
      await db.query(
        `INSERT INTO komentar (id_user, id_resep, teks_komentar, tanggal_komentar)
         VALUES (?, ?, ?, NOW())`,
        [id_user, recipeId, comment.trim()]
      );
      await createNotification(db, { recipeId, senderId: id_user, tipe: 'komentar' });
    }

    if (score) {
      await db.query(
        `INSERT INTO rating (id_user, id_resep, skor_rating, tanggal_rating)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE skor_rating = ?, tanggal_rating = NOW()`,
        [id_user, recipeId, score, score]
      );
      await createNotification(db, { recipeId, senderId: id_user, tipe: 'rating' });
    }

    res.status(201).json({ success: true, message: 'Ulasan berhasil ditambahkan!' });
  } catch (error) {
    console.error('Error Post Review:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal menambahkan ulasan.' });
  }
});

// 11. Edit Ulasan & Rating Milik User (JWT)
router.put('/:id/reviews/:reviewId', authenticate, async (req, res) => {
  try {
    const { id: recipeId, reviewId } = req.params;
    const id_user = req.user.id_user;
    const { rating, comment } = req.body;

    const [updateResult] = await db.query(
      `UPDATE komentar
       SET teks_komentar = ?, tanggal_komentar = NOW()
       WHERE id_komentar = ? AND id_resep = ? AND id_user = ?`,
      [comment ? comment.trim() : '', reviewId, recipeId, id_user]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(403).json({
        message: 'Ulasan tidak ditemukan atau Anda tidak memiliki akses untuk mengubahnya.',
      });
    }

    const score = rating ? parseInt(rating, 10) : null;
    if (score && score >= 1 && score <= 5) {
      await db.query(
        `INSERT INTO rating (id_user, id_resep, skor_rating, tanggal_rating)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE skor_rating = ?, tanggal_rating = NOW()`,
        [id_user, recipeId, score, score]
      );
    }

    res.json({ success: true, message: 'Ulasan berhasil diperbarui!' });
  } catch (error) {
    console.error('Error Update Review:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal memperbarui ulasan.' });
  }
});

// 11b. Hapus Komentar (JWT)
// Boleh dilakukan oleh: (a) pemilik komentar, atau (b) pembuat resep (moderasi komentar di resepnya).
router.delete('/:id/reviews/:reviewId', authenticate, async (req, res) => {
  try {
    const { id: recipeId, reviewId } = req.params;
    const userId = req.user.id_user;

    const [rows] = await db.query(
      `SELECT k.id_komentar, k.id_user AS commenter_id, r.id_user AS recipe_owner_id
       FROM komentar k JOIN resep r ON k.id_resep = r.id_resep
       WHERE k.id_komentar = ? AND k.id_resep = ?`,
      [reviewId, recipeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan.' });
    }

    const { commenter_id, recipe_owner_id } = rows[0];
    const isCommenter = String(commenter_id) === String(userId);
    const isRecipeOwner = String(recipe_owner_id) === String(userId);

    if (!isCommenter && !isRecipeOwner) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menghapus komentar ini.' });
    }

    await db.query('DELETE FROM komentar WHERE id_komentar = ?', [reviewId]);

    // Jika pemilik menghapus komentar terakhirnya, ratingnya ikut dihapus agar tidak "menggantung"
    if (isCommenter) {
      const [remaining] = await db.query(
        'SELECT COUNT(*) AS total FROM komentar WHERE id_user = ? AND id_resep = ?',
        [userId, recipeId]
      );
      if (remaining[0].total === 0) {
        await db.query('DELETE FROM rating WHERE id_user = ? AND id_resep = ?', [userId, recipeId]);
      }
    }

    res.json({ success: true, message: 'Komentar berhasil dihapus.' });
  } catch (error) {
    console.error('Error Delete Review:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal menghapus komentar.' });
  }
});

// 12. Buat Resep Baru
router.post('/', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const id_user = req.user.id_user;
    const { nama_resep, id_kategori, foto, ingredients, steps } = req.body;
    if (!nama_resep || !String(nama_resep).trim()) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Nama resep wajib diisi.' });
    }

    const { waktuMemasak, tingkatKesulitan } = normalizeRecipeMeta(req.body);
    const langkahText = Array.isArray(steps) ? steps.join('\n') : steps;

    const [recipeResult] = await connection.query(
      `INSERT INTO resep (
        id_user, id_kategori, nama_resep, langkah, foto, waktu_memasak, tingkat_kesulitan, tanggal_dibuat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id_user,
        id_kategori || 1,
        nama_resep,
        langkahText,
        foto || '🥘',
        waktuMemasak,
        tingkatKesulitan,
      ]
    );

    const recipeId = recipeResult.insertId;
    await syncRecipeIngredients(connection, recipeId, ingredients);

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Resep berhasil dibuat!',
      id_resep: recipeId,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error Create Recipe:', error.sqlMessage || error.message);
    res.status(500).json({ success: false, message: 'Gagal menambah resep.' });
  } finally {
    connection.release();
  }
});

// 13. Update Resep
router.put('/:id', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const recipeId = req.params.id;

    const [owner] = await connection.query(
      'SELECT id_user FROM resep WHERE id_resep = ? AND deleted_at IS NULL',
      [recipeId]
    );
    if (owner.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Resep tidak ditemukan.' });
    }
    if (String(owner[0].id_user) !== String(req.user.id_user)) {
      await connection.rollback();
      return res.status(403).json({ message: 'Anda hanya dapat mengubah resep milik sendiri.' });
    }
    const { nama_resep, id_kategori, foto, ingredients, steps } = req.body;
    const { waktuMemasak, tingkatKesulitan } = normalizeRecipeMeta(req.body);
    const langkahText = Array.isArray(steps) ? steps.join('\n') : steps;

    await connection.query(
      `UPDATE resep 
       SET nama_resep = ?, id_kategori = ?, foto = ?, langkah = ?, waktu_memasak = ?, tingkat_kesulitan = ?
       WHERE id_resep = ?`,
      [nama_resep, id_kategori || 1, foto || '🥘', langkahText, waktuMemasak, tingkatKesulitan, recipeId]
    );

    if (Array.isArray(ingredients)) {
      await connection.query('DELETE FROM resep_bahan WHERE id_resep = ?', [recipeId]);
      await syncRecipeIngredients(connection, recipeId, ingredients);
    }

    await connection.commit();
    res.json({ success: true, message: 'Resep berhasil diperbarui!' });
  } catch (error) {
    await connection.rollback();
    console.error('Error Update Recipe:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal memperbarui resep.' });
  } finally {
    connection.release();
  }
});

// Helper: pastikan resep ada & milik user yang login. Mengembalikan baris resep atau mengirim error.
const findOwnedRecipe = async (req, res, { deleted }) => {
  const [rows] = await db.query(
    `SELECT id_resep, id_user, deleted_at FROM resep
     WHERE id_resep = ? AND deleted_at IS ${deleted ? 'NOT NULL' : 'NULL'}`,
    [req.params.id]
  );
  if (rows.length === 0) {
    res.status(404).json({ message: 'Resep tidak ditemukan.' });
    return null;
  }
  if (String(rows[0].id_user) !== String(req.user.id_user)) {
    res.status(403).json({ message: 'Anda hanya dapat mengelola resep milik sendiri.' });
    return null;
  }
  return rows[0];
};

// 14. Hapus Resep (SOFT DELETE: dipindah ke Sampah, masih bisa dipulihkan)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const recipe = await findOwnedRecipe(req, res, { deleted: false });
    if (!recipe) return;

    await db.query('UPDATE resep SET deleted_at = NOW() WHERE id_resep = ?', [req.params.id]);
    res.json({
      success: true,
      message: 'Resep dipindahkan ke Sampah. Kamu bisa memulihkannya kapan saja.',
    });
  } catch (error) {
    console.error('Error Delete Recipe:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal menghapus resep.' });
  }
});

// 15. Pulihkan Resep dari Sampah
router.patch('/:id/restore', authenticate, async (req, res) => {
  try {
    const recipe = await findOwnedRecipe(req, res, { deleted: true });
    if (!recipe) return;

    await db.query('UPDATE resep SET deleted_at = NULL WHERE id_resep = ?', [req.params.id]);
    res.json({ success: true, message: 'Resep berhasil dipulihkan.' });
  } catch (error) {
    console.error('Error Restore Recipe:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal memulihkan resep.' });
  }
});

// 16. Hapus Permanen (hanya untuk resep yang sudah ada di Sampah)
router.delete('/:id/permanent', authenticate, async (req, res) => {
  try {
    const recipe = await findOwnedRecipe(req, res, { deleted: true });
    if (!recipe) return;

    await db.query('DELETE FROM resep WHERE id_resep = ?', [req.params.id]);
    res.json({ success: true, message: 'Resep dihapus permanen.' });
  } catch (error) {
    console.error('Error Permanent Delete Recipe:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Gagal menghapus resep secara permanen.' });
  }
});

module.exports = router;
