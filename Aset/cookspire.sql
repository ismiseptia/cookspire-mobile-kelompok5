-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 04 Nov 2026 pada 09.40
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cookspire`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `bahan`
--

CREATE TABLE `bahan` (
  `id_bahan` int(11) NOT NULL,
  `nama_bahan` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `bahan`
--

INSERT INTO `bahan` (`id_bahan`, `nama_bahan`) VALUES
(3, 'Bawang Merah'),
(2, 'Bawang Putih'),
(4, 'Cabai'),
(9, 'Garam'),
(8, 'Gula'),
(7, 'Kecap Manis'),
(6, 'Nasi'),
(5, 'Telur'),
(1, 'Tempe');

-- --------------------------------------------------------

--
-- Struktur dari tabel `favorit`
--

CREATE TABLE `favorit` (
  `id_favorit` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_resep` int(11) NOT NULL,
  `tanggal_favorit` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `favorit`
--

INSERT INTO `favorit` (`id_favorit`, `id_user`, `id_resep`, `tanggal_favorit`) VALUES
(1, 2, 1, '2026-10-15 12:12:17');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kategori`
--

CREATE TABLE `kategori` (
  `id_kategori` int(11) NOT NULL,
  `nama_kategori` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `kategori`
--

INSERT INTO `kategori` (`id_kategori`, `nama_kategori`) VALUES
(4, 'Camilan'),
(3, 'Dessert'),
(1, 'Makanan Utama'),
(2, 'Minuman'),
(5, 'Sayuran');

-- --------------------------------------------------------

--
-- Struktur dari tabel `komentar`
--

CREATE TABLE `komentar` (
  `id_komentar` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_resep` int(11) NOT NULL,
  `teks_komentar` text NOT NULL,
  `tanggal_komentar` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `komentar`
--

INSERT INTO `komentar` (`id_komentar`, `id_user`, `id_resep`, `teks_komentar`, `tanggal_komentar`) VALUES
(1, 2, 1, 'Enak dan mudah dibuat!', '2026-10-15 12:12:17');

-- --------------------------------------------------------

--
-- Struktur dari tabel `notifikasi`
--

CREATE TABLE `notifikasi` (
  `id_notifikasi` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_resep` int(11) NOT NULL,
  `id_pengirim` int(11) NOT NULL,
  `tipe` enum('komentar','rating') NOT NULL,
  `sudah_dibaca` tinyint(1) NOT NULL DEFAULT 0,
  `tanggal` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `rating`
--

CREATE TABLE `rating` (
  `id_rating` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_resep` int(11) NOT NULL,
  `skor_rating` int(11) NOT NULL,
  `tanggal_rating` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data untuk tabel `rating`
--

INSERT INTO `rating` (`id_rating`, `id_user`, `id_resep`, `skor_rating`, `tanggal_rating`) VALUES
(1, 2, 1, 5, '2026-10-15 12:12:17'),
(2, 1, 2, 4, '2026-10-15 12:12:17');

-- --------------------------------------------------------

--
-- Struktur dari tabel `resep`
--

CREATE TABLE `resep` (
  `id_resep` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_kategori` int(11) NOT NULL,
  `nama_resep` varchar(150) NOT NULL,
  `langkah` text NOT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `tanggal_dibuat` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `resep`
--

INSERT INTO `resep` (`id_resep`, `id_user`, `id_kategori`, `nama_resep`, `langkah`, `foto`, `tanggal_dibuat`) VALUES
(1, 1, 1, 'Nasi Goreng Telur', '1. Tumis bawang.\n2. Masukkan nasi dan kecap.\n3. Tambahkan telur, aduk rata.', NULL, '2026-10-15 12:12:16'),
(2, 2, 1, 'Tempe Orek', '1. Potong tempe.\n2. Goreng setengah matang.\n3. Tumis dengan bumbu dan kecap.', NULL, '2026-10-15 12:12:16');

-- --------------------------------------------------------

--
-- Struktur dari tabel `resep_bahan`
--

CREATE TABLE `resep_bahan` (
  `id_resep_bahan` int(11) NOT NULL,
  `id_resep` int(11) NOT NULL,
  `id_bahan` int(11) NOT NULL,
  `jumlah` decimal(15,5) NOT NULL,
  `satuan` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `resep_bahan`
--

INSERT INTO `resep_bahan` (`id_resep_bahan`, `id_resep`, `id_bahan`, `jumlah`, `satuan`) VALUES
(1, 1, 6, 1.00000, 'piring'),
(2, 1, 5, 1.00000, 'butir'),
(3, 1, 3, 3.00000, 'siung'),
(4, 1, 7, 2.00000, 'sdm'),
(5, 2, 1, 200.00000, 'gram'),
(6, 2, 2, 2.00000, 'siung'),
(7, 2, 4, 3.00000, 'buah'),
(8, 2, 7, 3.00000, 'sdm');

-- --------------------------------------------------------

--
-- Struktur dari tabel `user`
--

CREATE TABLE `user` (
  `id_user` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `tanggal_daftar` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `user`
--

INSERT INTO `user` (`id_user`, `nama`, `email`, `password`, `tanggal_daftar`) VALUES
(1, 'Ahmad Khoirur Rohman', 'ahmad@example.com', 'HASH_PLACEHOLDER', '2026-10-15 12:12:16'),
(2, 'Ismi Septia Utami', 'ismi@example.com', 'HASH_PLACEHOLDER', '2026-10-15 12:12:16'),
(3, 'Irur', 'tugasirur@gmail.com', '$2b$10$71bZOz/czmxfWBwkFH12xum9HmKPDr...xzG3ThRWl9b1SqNzHPGS', '2026-10-25 20:59:16');

-- --------------------------------------------------------

--
-- Stand-in struktur untuk tampilan `v_resep_populer`
-- (Lihat di bawah untuk tampilan aktual)
--
CREATE TABLE `v_resep_populer` (
`id_resep` int(11)
,`nama_resep` varchar(150)
,`foto` varchar(255)
,`id_user` int(11)
,`rata_rating` decimal(12,1)
,`jumlah_rating` bigint(21)
,`jumlah_komentar` bigint(21)
);

-- --------------------------------------------------------

--
-- Struktur untuk view `v_resep_populer`
--
DROP TABLE IF EXISTS `v_resep_populer`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_resep_populer`  AS SELECT `r`.`id_resep` AS `id_resep`, `r`.`nama_resep` AS `nama_resep`, `r`.`foto` AS `foto`, `r`.`id_user` AS `id_user`, coalesce(round(avg(`rt`.`skor_rating`),1),0) AS `rata_rating`, count(distinct `rt`.`id_rating`) AS `jumlah_rating`, count(distinct `k`.`id_komentar`) AS `jumlah_komentar` FROM ((`resep` `r` left join `rating` `rt` on(`rt`.`id_resep` = `r`.`id_resep`)) left join `komentar` `k` on(`k`.`id_resep` = `r`.`id_resep`)) GROUP BY `r`.`id_resep`, `r`.`nama_resep`, `r`.`foto`, `r`.`id_user` ORDER BY coalesce(round(avg(`rt`.`skor_rating`),1),0) DESC, count(distinct `rt`.`id_rating`) DESC ;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `bahan`
--
ALTER TABLE `bahan`
  ADD PRIMARY KEY (`id_bahan`),
  ADD UNIQUE KEY `uq_bahan_nama` (`nama_bahan`);

--
-- Indeks untuk tabel `favorit`
--
ALTER TABLE `favorit`
  ADD PRIMARY KEY (`id_favorit`),
  ADD UNIQUE KEY `uq_favorit_user_resep` (`id_user`,`id_resep`),
  ADD KEY `fk_favorit_resep` (`id_resep`);

--
-- Indeks untuk tabel `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id_kategori`),
  ADD UNIQUE KEY `uq_kategori_nama` (`nama_kategori`);

--
-- Indeks untuk tabel `komentar`
--
ALTER TABLE `komentar`
  ADD PRIMARY KEY (`id_komentar`),
  ADD KEY `fk_komentar_user` (`id_user`),
  ADD KEY `idx_komentar_resep` (`id_resep`);

--
-- Indeks untuk tabel `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id_notifikasi`),
  ADD KEY `fk_notif_resep` (`id_resep`),
  ADD KEY `fk_notif_pengirim` (`id_pengirim`),
  ADD KEY `idx_notif_user` (`id_user`,`sudah_dibaca`);

--
-- Indeks untuk tabel `rating`
--
ALTER TABLE `rating`
  ADD PRIMARY KEY (`id_rating`),
  ADD UNIQUE KEY `uq_rating_user_resep` (`id_user`,`id_resep`),
  ADD KEY `fk_rating_resep` (`id_resep`);

--
-- Indeks untuk tabel `resep`
--
ALTER TABLE `resep`
  ADD PRIMARY KEY (`id_resep`),
  ADD KEY `idx_resep_nama` (`nama_resep`),
  ADD KEY `idx_resep_user` (`id_user`),
  ADD KEY `idx_resep_kategori` (`id_kategori`);

--
-- Indeks untuk tabel `resep_bahan`
--
ALTER TABLE `resep_bahan`
  ADD PRIMARY KEY (`id_resep_bahan`),
  ADD UNIQUE KEY `uq_resep_bahan` (`id_resep`,`id_bahan`),
  ADD KEY `fk_rb_bahan` (`id_bahan`);

--
-- Indeks untuk tabel `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `uq_user_email` (`email`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `bahan`
--
ALTER TABLE `bahan`
  MODIFY `id_bahan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `favorit`
--
ALTER TABLE `favorit`
  MODIFY `id_favorit` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id_kategori` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `komentar`
--
ALTER TABLE `komentar`
  MODIFY `id_komentar` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id_notifikasi` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `rating`
--
ALTER TABLE `rating`
  MODIFY `id_rating` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `resep`
--
ALTER TABLE `resep`
  MODIFY `id_resep` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `resep_bahan`
--
ALTER TABLE `resep_bahan`
  MODIFY `id_resep_bahan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `user`
--
ALTER TABLE `user`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `favorit`
--
ALTER TABLE `favorit`
  ADD CONSTRAINT `fk_favorit_resep` FOREIGN KEY (`id_resep`) REFERENCES `resep` (`id_resep`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_favorit_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `komentar`
--
ALTER TABLE `komentar`
  ADD CONSTRAINT `fk_komentar_resep` FOREIGN KEY (`id_resep`) REFERENCES `resep` (`id_resep`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komentar_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD CONSTRAINT `fk_notif_pengirim` FOREIGN KEY (`id_pengirim`) REFERENCES `user` (`id_user`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notif_resep` FOREIGN KEY (`id_resep`) REFERENCES `resep` (`id_resep`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rating`
--
ALTER TABLE `rating`
  ADD CONSTRAINT `fk_rating_resep` FOREIGN KEY (`id_resep`) REFERENCES `resep` (`id_resep`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rating_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `resep`
--
ALTER TABLE `resep`
  ADD CONSTRAINT `fk_resep_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori` (`id_kategori`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_resep_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `resep_bahan`
--
ALTER TABLE `resep_bahan`
  ADD CONSTRAINT `fk_rb_bahan` FOREIGN KEY (`id_bahan`) REFERENCES `bahan` (`id_bahan`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rb_resep` FOREIGN KEY (`id_resep`) REFERENCES `resep` (`id_resep`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
