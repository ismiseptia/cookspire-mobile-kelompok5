// Bungkus handler async supaya error otomatis diteruskan ke error handler
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Ubah path foto di DB menjadi URL lengkap yang bisa dibuka Expo
const fotoUrl = (req, foto) =>
  foto ? `${req.protocol}://${req.get('host')}/uploads/${foto}` : null;

// "bahan" bisa berupa array (JSON biasa) atau string JSON (multipart/form-data)
// Format: [{ "nama_bahan": "Tempe", "jumlah": 200, "satuan": "gram" }]
function parseBahan(input) {
  if (input === undefined || input === null || input === '') return null;
  let list = input;
  if (typeof input === 'string') {
    try {
      list = JSON.parse(input);
    } catch {
      return 'invalid';
    }
  }
  if (!Array.isArray(list)) return 'invalid';
  const clean = [];
  for (const b of list) {
    const nama = String(b.nama_bahan || '').trim();
    const jumlah = Number(b.jumlah);
    const satuan = String(b.satuan || '').trim();
    if (!nama || !Number.isFinite(jumlah) || jumlah <= 0 || !satuan) return 'invalid';
    clean.push({ nama_bahan: nama, jumlah, satuan });
  }
  return clean;
}

// Simpan daftar bahan ke tabel bahan + resep_bahan (dipanggil dalam transaksi)
async function simpanBahan(conn, idResep, daftar) {
  for (const b of daftar) {
    const [r] = await conn.query(
      `INSERT INTO bahan (nama_bahan) VALUES (?)
       ON DUPLICATE KEY UPDATE id_bahan = LAST_INSERT_ID(id_bahan)`,
      [b.nama_bahan]
    );
    await conn.query(
      `INSERT INTO resep_bahan (id_resep, id_bahan, jumlah, satuan) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE jumlah = VALUES(jumlah), satuan = VALUES(satuan)`,
      [idResep, r.insertId, b.jumlah, b.satuan]
    );
  }
}

module.exports = { asyncHandler, fotoUrl, parseBahan, simpanBahan };
