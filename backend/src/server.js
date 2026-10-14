require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = require('./middleware/upload');
const db = require('./config/db');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET belum diisi. Salin .env.example menjadi .env lalu isi nilainya.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(upload.uploadDir));

app.get('/', (req, res) => res.json({ app: 'Cookspire API', status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/kategori', require('./routes/kategori'));
app.use('/api/resep', require('./routes/resep'));
app.use('/api/resep', require('./routes/interaksi')); // /:id/rating, /:id/komentar, /:id/favorit
app.use('/api/favorit', require('./routes/favorit'));
app.use('/api/user', require('./routes/user'));
app.use('/api/notifikasi', require('./routes/notifikasi'));

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));

// Penanganan error terpusat
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError)
    return res.status(400).json({
      message: err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran foto maksimal 5 MB' : err.message,
    });
  if (err.message && err.message.startsWith('Format foto'))
    return res.status(400).json({ message: err.message });
  if (err.code === 'ER_NO_REFERENCED_ROW_2')
    return res.status(400).json({ message: 'Data referensi (misalnya kategori) tidak valid' });

  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Cookspire API berjalan di http://localhost:${PORT}`);
  try {
    await db.query('SELECT 1');
    console.log('Koneksi database berhasil');
  } catch (e) {
    console.error('Gagal terhubung ke database:', e.message);
  }
});
