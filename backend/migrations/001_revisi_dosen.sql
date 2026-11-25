-- Migrasi revisi dosen (MariaDB / XAMPP).
-- Aman dijalankan berulang kali (memakai IF NOT EXISTS).
-- Jalankan di database `cookspire` lewat phpMyAdmin tab SQL.

-- Kolom yang dipakai kode backend tetapi belum ada di dump cookspire.sql lama
ALTER TABLE `user`  ADD COLUMN IF NOT EXISTS `foto` varchar(255) DEFAULT NULL;
ALTER TABLE `user`  ADD COLUMN IF NOT EXISTS `bio`  varchar(255) DEFAULT NULL;
ALTER TABLE `resep` ADD COLUMN IF NOT EXISTS `waktu_memasak`     int(11) NOT NULL DEFAULT 30;
ALTER TABLE `resep` ADD COLUMN IF NOT EXISTS `tingkat_kesulitan` varchar(10) NOT NULL DEFAULT 'Mudah';
ALTER TABLE `favorit` ADD COLUMN IF NOT EXISTS `tanggal_favorit` datetime NOT NULL DEFAULT current_timestamp();
ALTER TABLE `rating`  ADD COLUMN IF NOT EXISTS `tanggal_rating`  datetime NOT NULL DEFAULT current_timestamp();

-- Revisi 5: soft delete resep (NULL = aktif, terisi = ada di "Sampah" dan bisa dipulihkan)
ALTER TABLE `resep` ADD COLUMN IF NOT EXISTS `deleted_at` datetime DEFAULT NULL;
ALTER TABLE `resep` ADD INDEX IF NOT EXISTS `idx_resep_deleted` (`id_user`, `deleted_at`);

-- Revisi 2: mempercepat pencarian berdasarkan bahan
ALTER TABLE `bahan` ADD INDEX IF NOT EXISTS `idx_bahan_nama` (`nama_bahan`);
ALTER TABLE `resep_bahan` ADD INDEX IF NOT EXISTS `idx_resep_bahan_bahan` (`id_bahan`);

-- Revisi 3: notifikasi
ALTER TABLE `notifikasi` ADD INDEX IF NOT EXISTS `idx_notif_user` (`id_user`, `sudah_dibaca`, `tanggal`);
