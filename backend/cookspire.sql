-- =====================================================
-- COOKSPIRE - Database Schema (MySQL / MariaDB)
-- Sesuai Dokumen Analisis Kebutuhan Kelompok 5
-- Cara pakai: phpMyAdmin > tab "SQL" > paste > Kirim/Go
-- =====================================================

CREATE DATABASE IF NOT EXISTS cookspire
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cookspire;

-- Urutan DROP dibalik dulu supaya aman dijalankan ulang
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifikasi, favorit, komentar, rating, resep_bahan, bahan, resep, kategori, `user`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USER (US-01, US-02, US-10)
CREATE TABLE `user` (
  id_user        INT AUTO_INCREMENT PRIMARY KEY,
  nama           VARCHAR(100) NOT NULL,
  email          VARCHAR(100) NOT NULL,
  password       VARCHAR(255) NOT NULL,  -- simpan HASH (bcrypt), bukan teks asli
  tanggal_daftar DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_email UNIQUE (email)
) ENGINE=InnoDB;

-- 2. KATEGORI (US-06)
CREATE TABLE kategori (
  id_kategori   INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(100) NOT NULL,
  CONSTRAINT uq_kategori_nama UNIQUE (nama_kategori)
) ENGINE=InnoDB;

-- 3. RESEP (US-03, US-04, US-05, US-11, US-14)
CREATE TABLE resep (
  id_resep      INT AUTO_INCREMENT PRIMARY KEY,
  id_user       INT NOT NULL,
  id_kategori   INT NOT NULL,
  nama_resep    VARCHAR(150) NOT NULL,
  langkah       TEXT NOT NULL,
  foto          VARCHAR(255) NULL,       -- path / URL foto masakan
  tanggal_dibuat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resep_user
    FOREIGN KEY (id_user) REFERENCES `user`(id_user)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_resep_kategori
    FOREIGN KEY (id_kategori) REFERENCES kategori(id_kategori)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_resep_nama (nama_resep),
  INDEX idx_resep_user (id_user),
  INDEX idx_resep_kategori (id_kategori)
) ENGINE=InnoDB;

-- 4. BAHAN (US-06 pencarian by bahan)
CREATE TABLE bahan (
  id_bahan   INT AUTO_INCREMENT PRIMARY KEY,
  nama_bahan VARCHAR(100) NOT NULL,
  CONSTRAINT uq_bahan_nama UNIQUE (nama_bahan)
) ENGINE=InnoDB;

-- 5. RESEP_BAHAN (relasi resep <-> bahan)
CREATE TABLE resep_bahan (
  id_resep_bahan INT AUTO_INCREMENT PRIMARY KEY,
  id_resep       INT NOT NULL,
  id_bahan       INT NOT NULL,
  jumlah         DECIMAL(15,5) NOT NULL,
  satuan         VARCHAR(30) NOT NULL,
  CONSTRAINT fk_rb_resep
    FOREIGN KEY (id_resep) REFERENCES resep(id_resep)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rb_bahan
    FOREIGN KEY (id_bahan) REFERENCES bahan(id_bahan)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT uq_resep_bahan UNIQUE (id_resep, id_bahan)
) ENGINE=InnoDB;

-- 6. RATING (US-07, US-12)
CREATE TABLE rating (
  id_rating      INT AUTO_INCREMENT PRIMARY KEY,
  id_user        INT NOT NULL,
  id_resep       INT NOT NULL,
  skor_rating    INT NOT NULL,
  tanggal_rating DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rating_user
    FOREIGN KEY (id_user) REFERENCES `user`(id_user)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rating_resep
    FOREIGN KEY (id_resep) REFERENCES resep(id_resep)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_skor CHECK (skor_rating BETWEEN 1 AND 5),
  CONSTRAINT uq_rating_user_resep UNIQUE (id_user, id_resep)  -- 1 user = 1 rating per resep
) ENGINE=InnoDB;

-- 7. KOMENTAR (US-08)
CREATE TABLE komentar (
  id_komentar      INT AUTO_INCREMENT PRIMARY KEY,
  id_user          INT NOT NULL,
  id_resep         INT NOT NULL,
  teks_komentar    TEXT NOT NULL,
  tanggal_komentar DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_komentar_user
    FOREIGN KEY (id_user) REFERENCES `user`(id_user)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_komentar_resep
    FOREIGN KEY (id_resep) REFERENCES resep(id_resep)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_komentar_resep (id_resep)
) ENGINE=InnoDB;

-- 8. FAVORIT (US-09)
CREATE TABLE favorit (
  id_favorit      INT AUTO_INCREMENT PRIMARY KEY,
  id_user         INT NOT NULL,
  id_resep        INT NOT NULL,
  tanggal_favorit DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_favorit_user
    FOREIGN KEY (id_user) REFERENCES `user`(id_user)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_favorit_resep
    FOREIGN KEY (id_resep) REFERENCES resep(id_resep)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_favorit_user_resep UNIQUE (id_user, id_resep)  -- tidak bisa favorit dobel
) ENGINE=InnoDB;

-- 9. NOTIFIKASI (US-13, Could) -- TAMBAHAN: belum ada di PDM/LDM dokumenmu
CREATE TABLE notifikasi (
  id_notifikasi INT AUTO_INCREMENT PRIMARY KEY,
  id_user       INT NOT NULL,             -- penerima notifikasi (pemilik resep)
  id_resep      INT NOT NULL,
  id_pengirim   INT NOT NULL,             -- user yang komentar / memberi rating
  tipe          ENUM('komentar','rating') NOT NULL,
  sudah_dibaca  TINYINT(1) NOT NULL DEFAULT 0,
  tanggal       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user
    FOREIGN KEY (id_user) REFERENCES `user`(id_user) ON DELETE CASCADE,
  CONSTRAINT fk_notif_resep
    FOREIGN KEY (id_resep) REFERENCES resep(id_resep) ON DELETE CASCADE,
  CONSTRAINT fk_notif_pengirim
    FOREIGN KEY (id_pengirim) REFERENCES `user`(id_user) ON DELETE CASCADE,
  INDEX idx_notif_user (id_user, sudah_dibaca)
) ENGINE=InnoDB;

-- =====================================================
-- VIEW: Resep populer (US-12) + rata-rata rating
-- =====================================================
CREATE OR REPLACE VIEW v_resep_populer AS
SELECT r.id_resep, r.nama_resep, r.foto, r.id_user,
       COALESCE(ROUND(AVG(rt.skor_rating), 1), 0) AS rata_rating,
       COUNT(DISTINCT rt.id_rating)  AS jumlah_rating,
       COUNT(DISTINCT k.id_komentar) AS jumlah_komentar
FROM resep r
LEFT JOIN rating rt ON rt.id_resep = r.id_resep
LEFT JOIN komentar k ON k.id_resep = r.id_resep
GROUP BY r.id_resep, r.nama_resep, r.foto, r.id_user
ORDER BY rata_rating DESC, jumlah_rating DESC;

-- =====================================================
-- DATA AWAL (contoh)
-- =====================================================
INSERT INTO kategori (nama_kategori) VALUES
  ('Makanan Utama'), ('Minuman'), ('Dessert'), ('Camilan'), ('Sayuran');

INSERT INTO bahan (nama_bahan) VALUES
  ('Tempe'), ('Bawang Putih'), ('Bawang Merah'), ('Cabai'),
  ('Telur'), ('Nasi'), ('Kecap Manis'), ('Gula'), ('Garam');

-- Password di bawah hanya placeholder; di aplikasi isi dengan hash bcrypt
INSERT INTO `user` (nama, email, password) VALUES
  ('Ahmad Khoirur Rohman', 'ahmad@example.com', 'HASH_PLACEHOLDER'),
  ('Ismi Septia Utami',    'ismi@example.com',  'HASH_PLACEHOLDER');

INSERT INTO resep (id_user, id_kategori, nama_resep, langkah, foto) VALUES
  (1, 1, 'Nasi Goreng Telur',
   '1. Tumis bawang.\n2. Masukkan nasi dan kecap.\n3. Tambahkan telur, aduk rata.', NULL),
  (2, 1, 'Tempe Orek',
   '1. Potong tempe.\n2. Goreng setengah matang.\n3. Tumis dengan bumbu dan kecap.', NULL);

INSERT INTO resep_bahan (id_resep, id_bahan, jumlah, satuan) VALUES
  (1, 6, 1, 'piring'), (1, 5, 1, 'butir'), (1, 3, 3, 'siung'), (1, 7, 2, 'sdm'),
  (2, 1, 200, 'gram'), (2, 2, 2, 'siung'), (2, 4, 3, 'buah'), (2, 7, 3, 'sdm');

INSERT INTO rating (id_user, id_resep, skor_rating) VALUES (2, 1, 5), (1, 2, 4);
INSERT INTO komentar (id_user, id_resep, teks_komentar) VALUES (2, 1, 'Enak dan mudah dibuat!');
INSERT INTO favorit (id_user, id_resep) VALUES (2, 1);

-- =====================================================
-- CONTOH QUERY (untuk dipakai di backend / API nanti)
-- =====================================================
-- Cari berdasarkan nama:
--   SELECT * FROM resep WHERE nama_resep LIKE '%nasi%';
-- Cari berdasarkan kategori:
--   SELECT r.* FROM resep r JOIN kategori k ON k.id_kategori = r.id_kategori
--   WHERE k.nama_kategori = 'Makanan Utama';
-- Cari berdasarkan bahan (US-06 kriteria 3):
--   SELECT DISTINCT r.* FROM resep r
--   JOIN resep_bahan rb ON rb.id_resep = r.id_resep
--   JOIN bahan b ON b.id_bahan = rb.id_bahan
--   WHERE b.nama_bahan LIKE '%tempe%';
