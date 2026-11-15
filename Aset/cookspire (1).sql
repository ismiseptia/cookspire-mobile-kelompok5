-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 15 Nov 2026 pada 15.39
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
(23, 'Air Panas (untuk coklat)'),
(20, 'Air Panas (untuk dalgona)'),
(3, 'Bawang Merah'),
(2, 'Bawang Putih'),
(4, 'Cabai'),
(21, 'Coklat Bubuk'),
(16, 'Danish Pastry'),
(18, 'Es Batu'),
(9, 'Garam'),
(8, 'Gula'),
(11, 'Gula Pasir'),
(7, 'Kecap Manis'),
(25, 'Kencur'),
(19, 'Kopi Instan Nescafe'),
(12, 'Kuning Telur'),
(6, 'Nasi'),
(15, 'Pasta Vanilla'),
(14, 'Susu Cair'),
(22, 'Susu Kental Manis Putih'),
(17, 'Susu UHT Full Cream'),
(24, 'Tahu'),
(5, 'Telur'),
(1, 'Tempe'),
(13, 'Tepung Maizena'),
(10, 'Whipping Cream Dairy');

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
(1, 2, 1, '2026-10-15 12:12:17'),
(2, 4, 1, '2026-11-04 23:59:47');

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
(1, 2, 1, 'Enak dan mudah dibuat!', '2026-10-15 12:12:17'),
(2, 1, 1, 'Boleh nih di coba', '2026-11-04 22:35:58'),
(3, 1, 2, 'Bagus', '2026-11-06 10:40:03'),
(4, 1, 2, 'Mantap', '2026-11-06 10:40:55'),
(5, 4, 5, 'Bahannya emang itu doang tah', '2026-11-12 13:50:57');

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
(2, 1, 2, 5, '2026-11-06 10:40:55'),
(3, 1, 1, 4, '2026-11-04 22:35:58'),
(6, 4, 5, 1, '2026-11-12 13:50:57');

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
(2, 2, 1, 'Tempe Orek', '1. Potong tempe.\n2. Goreng setengah matang.\n3. Tumis dengan bumbu dan kecap.', NULL, '2026-10-15 12:12:16'),
(3, 4, 3, 'Portuguese Egg Tart Simple', 'Ambil Danish pastry cetak bulat / sesuaikan dengan loyang, kemudian sisihkan\nCampur semua bahan jadi satu, kemudian saring\nTuangkan ke dalam cetakan yang sudah ada adonan pastry di dalamnya tadi, kemudian panggang di suhu 200 derajat Celcius sampai matang kurang lebih 35 menit ( sesuaikan oven di rumah masing2)\nJika sudah matang keluarkan dari oven, dan juga lepaskan dari cetakannya biar dingin suhu ruang, lalu sajikan', '🍰', '2026-11-04 20:54:43'),
(4, 4, 2, 'Es Kopi Susu Cokelat', 'Panaskan air hingga mendidih untuk melarutkan kopi dan cokelat\nMembuat Dalgona kopi => (bila punya mikk frother) Tuangkan 2 SDM air panas ke gelas berisi kopi dan gula tadi lalu kocok menggunakan milk frother sampai kopi mengembang\n(bila tidak punya mikk frother) masukkan kopi dan gula ke dalam botol kecil food grade yang tahan panas, tambahkan air panas, tutup botolnya hingga rapat lalu kocok botol sampai kopi mengembang\nMembuat coklat=> Siapkan gelas saji, masukkan 1 SDM coklat bubuk, 1 sachet susu kental manis putih, dan tuangkan 5 SDM air panas. Lalu aduk hingga tercampur rata. (Di sini, Anda dapat menambahkan gula pasir sesuai selera bila dirasa suka manis)\nMasukkan secukupnya es batu ke dalam gelas saji\nMasukkan 200 ml Susu UHT full cream ke dalam gelas saji\nTuang secukupnya kopi yang telah mengembang tadi di atasnya. Dan siap disajikan', '🥤', '2026-11-05 00:36:19'),
(5, 8, 1, 'Tahu orek enak', 'Siapkan wajan\nLalu hidupkan', '🍲', '2026-11-06 10:42:41');

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
(8, 2, 7, 3.00000, 'sdm'),
(9, 3, 10, 100.00000, 'ml'),
(10, 3, 11, 85.00000, 'gram'),
(11, 3, 12, 3.00000, 'butir '),
(12, 3, 13, 20.00000, 'gram'),
(13, 3, 14, 370.00000, 'ml'),
(14, 3, 15, 1.00000, 'sdt'),
(15, 3, 16, 1.00000, 'lembar'),
(16, 4, 17, 200.00000, 'ml'),
(17, 4, 18, 1.00000, 'secukupnya'),
(18, 4, 19, 1.00000, 'sachet'),
(19, 4, 11, 1.00000, 'sdm'),
(20, 4, 20, 2.00000, 'sdm'),
(21, 4, 21, 1.00000, 'sdm'),
(22, 4, 22, 1.00000, 'sachet'),
(23, 4, 23, 5.00000, 'sdm'),
(24, 5, 24, 5.00000, '1'),
(25, 5, 25, 2.00000, '2');

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
(4, 'Irur', 'irur@indo.com', '$2b$10$he9P8Qw8blMPjuga0YafL.1Msqjphr3k1T7w5LygH4k7qJhOW5ppK', '2026-11-04 20:06:08'),
(5, 'Ismi', 'Ismi@indo.com', '$2b$10$27.t85p1Q3Yjlhes9gA98OmkIz68bZYd4pTr1cD3MJ7PG8xUFGht2', '2026-11-04 23:31:02'),
(6, 'Hamdalah ', 'hamdalah@indo.com', '$2b$10$0wQ6obXL7VpP6ZNPgRsyR.3Hi6VFRc0Vr2rWJyiguIXY03WsOKz8m', '2026-11-04 23:31:55'),
(7, 'Danis', 'danis@indo.com', '$2b$10$fNesb24pH/51H/idLTmSrO6ANQP8BpYTJeLvorD5QaNK.Raxi5l6G', '2026-11-04 23:32:20'),
(8, 'Hamdalah', 'hamdalah@gmail.com', '$2b$10$EIcflc6SqM2vPNPaZ1MxLenIrV0Etq5r7cFzwKXUiB0V/EwFHbi3G', '2026-11-06 10:33:20'),
(9, 'ismi', 'ismi@gmail.com', '$2b$10$42LrLaUM1auASxuyc3LeC.npjFJa9D9GNNlkoKPkIh57O//l3xgcS', '2026-11-12 13:43:13'),
(10, 'ismi', 'ismi01@gmail.com', '$2b$10$O8y3uNecAZlogD6NCHqTEOrZt7zzsMK.0Ugrc5ep9BXcTCcs9Ucyq', '2026-11-12 13:45:55'),
(11, 'rahmatika', 'rahmatika@gmail.com', '$2b$10$N.jGevQKFyZs7iZU3nTpTuluEG7LyHu5TZNnNDfRCitCVLO6P43By', '2026-11-12 13:51:44'),
(12, 'ismi', 'ismi', '$2b$10$MjEQU5hoBlzsslbZmSQGk.CKqnhsd6O4YIXg5TA2PaJz4onIyLEDy', '2026-11-12 14:09:29'),
(13, 'ismi', 'ismi02@gmail.com', '$2b$10$XMqDuCWA6oMZF5/7FTrgouIWN81GBWNCrFiQZqBBZmFGTg3WekEW.', '2026-11-12 14:12:07'),
(14, 'Rohman', 'tugasirur@gmail.com', '$2b$10$bp7yhQg6yL/nSYIDEGcclOPKPsPzLYYGclX0AgJvJ8Z.SsJqrqP/a', '2026-11-15 21:08:01');

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
  MODIFY `id_bahan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT untuk tabel `favorit`
--
ALTER TABLE `favorit`
  MODIFY `id_favorit` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id_kategori` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `komentar`
--
ALTER TABLE `komentar`
  MODIFY `id_komentar` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `id_resep` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `resep_bahan`
--
ALTER TABLE `resep_bahan`
  MODIFY `id_resep_bahan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT untuk tabel `user`
--
ALTER TABLE `user`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

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
