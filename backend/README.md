# Cookspire Backend (Express + MySQL)

REST API untuk aplikasi mobile Cookspire (React Native + Expo).

## 1. Persiapan
1. Install **Node.js** (versi 18 atau lebih baru) dan nyalakan **MySQL** (XAMPP: Apache + MySQL).
2. Jalankan file `cookspire.sql` di phpMyAdmin (tab SQL) agar database dan tabelnya terbentuk.
3. Di folder ini:
   ```bash
   npm install
   cp .env.example .env      # Windows: copy .env.example .env
   ```
4. Buka `.env`, isi `JWT_SECRET` dengan teks acak yang panjang. Sesuaikan `DB_USER` / `DB_PASSWORD` jika perlu.
5. Jalankan:
   ```bash
   npm run dev     # auto-restart saat kode berubah
   # atau
   npm start
   ```
   Cek di browser: http://localhost:3000 -> `{"app":"Cookspire API","status":"ok"}`

## 2. Menghubungkan dari Expo
`localhost` di HP / emulator BUKAN komputermu. Gunakan:
- **HP fisik (Expo Go):** IP LAN komputer, misalnya `http://192.168.1.10:3000` (HP dan komputer harus satu Wi-Fi; cek IP lewat `ipconfig` / `ifconfig`).
- **Android emulator:** `http://10.0.2.2:3000`
- **iOS simulator:** `http://localhost:3000`

Pastikan firewall Windows mengizinkan port 3000.

## 3. Daftar Endpoint
Header untuk endpoint bertanda (login): `Authorization: Bearer <token>`

| Method | Endpoint | Keterangan | User Story |
|---|---|---|---|
| POST | /api/auth/register | body: nama, email, password | US-01 |
| POST | /api/auth/login | body: email, password -> token | US-02 |
| GET | /api/auth/me (login) | data akun sendiri | - |
| GET | /api/kategori | daftar kategori | US-06 |
| GET | /api/resep | query: q, kategori, bahan, page, limit | US-05, US-06 |
| GET | /api/resep/populer | resep populer | US-12 |
| GET | /api/resep/saya (login) | resep yang saya unggah | US-14 |
| GET | /api/resep/:id | detail + bahan (+ rating_saya, is_favorit jika login) | US-05 |
| POST | /api/resep (login) | multipart: nama_resep, id_kategori, langkah, bahan, foto | US-03, US-04 |
| PUT | /api/resep/:id (login) | edit resep milik sendiri | US-11 |
| DELETE | /api/resep/:id (login) | hapus resep milik sendiri | US-11 |
| POST | /api/resep/:id/rating (login) | body: skor_rating (1-5) | US-07 |
| GET | /api/resep/:id/komentar | daftar komentar | US-08 |
| POST | /api/resep/:id/komentar (login) | body: teks_komentar | US-08 |
| POST | /api/resep/:id/favorit (login) | toggle favorit | US-09 |
| GET | /api/favorit (login) | koleksi favorit (lengkap dengan bahan & langkah, untuk offline) | US-09 |
| GET | /api/user/:id | profil pembuat + daftar resepnya | US-10 |

Format `bahan` (dikirim sebagai string JSON):
```json
[{"nama_bahan":"Tempe","jumlah":200,"satuan":"gram"},{"nama_bahan":"Kecap Manis","jumlah":3,"satuan":"sdm"}]
```

## 4. Contoh Pemakaian di Expo (React Native)
```js
const API = 'http://192.168.1.10:3000/api'; // ganti dengan IP kamu

// Login
const res = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const { token, user } = await res.json();   // simpan token di expo-secure-store

// Unggah resep + foto (uri dari expo-image-picker)
const form = new FormData();
form.append('nama_resep', 'Tempe Orek');
form.append('id_kategori', '1');
form.append('langkah', '1. Potong tempe...');
form.append('bahan', JSON.stringify([{ nama_bahan: 'Tempe', jumlah: 200, satuan: 'gram' }]));
form.append('foto', { uri: fotoUri, name: 'masakan.jpg', type: 'image/jpeg' });

await fetch(`${API}/resep`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },  // JANGAN set Content-Type manual
  body: form,
});
```

## 5. Catatan
- Password disimpan sebagai hash bcrypt; sesi memakai JWT (berlaku 7 hari).
- Foto disimpan di folder `uploads/` dan diakses lewat `/uploads/<nama-file>`; API sudah mengirim URL lengkapnya di field `foto`.
- Mode offline favorit (6.3 dokumen) dikerjakan di sisi aplikasi: simpan hasil `GET /api/favorit` ke penyimpanan lokal (AsyncStorage / expo-sqlite).
