-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 07 Sep 2026 pada 04.48
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
-- Database: `smartorder_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `price` int(11) DEFAULT 0,
  `description` text DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `status` enum('Tersedia','Habis') DEFAULT 'Tersedia',
  `image_url` varchar(500) DEFAULT NULL,
  `displayed` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `promo_price` int(11) DEFAULT NULL,
  `availability_type` enum('permanent','scheduled') DEFAULT 'permanent',
  `available_from` date DEFAULT NULL,
  `available_to` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `menu_items`
--

INSERT INTO `menu_items` (`id`, `name`, `category`, `price`, `description`, `stock`, `status`, `image_url`, `displayed`, `created_at`, `promo_price`, `availability_type`, `available_from`, `available_to`) VALUES
(18, 'Mie Yamin Spesial', 'Makanan', 15000, 'enak', 41, 'Tersedia', '/uploads/1783406437574-980562346.jpg', 1, '2026-07-07 06:40:37', 12000, 'permanent', NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `menu_recipes`
--

CREATE TABLE `menu_recipes` (
  `id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `stock_id` int(11) NOT NULL,
  `amount` decimal(10,2) DEFAULT 1.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `orders`
--

CREATE TABLE `orders` (
  `id` varchar(50) NOT NULL,
  `destination_label` varchar(100) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `total` int(11) DEFAULT 0,
  `status` enum('Menunggu','Diproses','Siap','Selesai','Dibatalkan') DEFAULT 'Menunggu',
  `payment_method` varchar(50) DEFAULT NULL,
  `amount_paid` int(11) DEFAULT 0,
  `change_amount` int(11) DEFAULT 0,
  `payment_proof` varchar(255) DEFAULT NULL,
  `payment_status` enum('Belum Bayar','Menunggu Validasi','Terverifikasi','Ditolak') DEFAULT 'Belum Bayar',
  `payment_note` text DEFAULT NULL,
  `order_type` enum('Dine-In','Takeaway','Delivery') DEFAULT 'Dine-In',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `orders`
--

INSERT INTO `orders` (`id`, `destination_label`, `customer_name`, `total`, `status`, `payment_method`, `amount_paid`, `change_amount`, `payment_proof`, `payment_status`, `payment_note`, `order_type`, `created_at`, `updated_at`, `user_id`) VALUES
('ORD-1606', 'Take Away', 'Customer Take Away', 16500, 'Selesai', 'Cash', 20000, 3500, NULL, 'Belum Bayar', NULL, 'Dine-In', '2026-07-07 06:42:47', '2026-08-31 01:32:39', NULL),
('ORD-2768', 'Take Away', 'Customer Take Away', 16500, 'Selesai', 'QRIS', 16500, 0, NULL, 'Belum Bayar', NULL, 'Dine-In', '2026-07-07 07:04:45', '2026-08-31 01:32:39', NULL),
('ORD-4034', 'Take Away', 'Customer Take Away', 16500, 'Selesai', 'QRIS', 16500, 0, NULL, 'Belum Bayar', NULL, 'Dine-In', '2026-07-07 07:40:23', '2026-08-31 01:32:39', NULL),
('ORD-4556', 'Take Away', 'Customer Take Away', 16500, 'Selesai', 'QRIS', 16500, 0, NULL, 'Belum Bayar', NULL, 'Dine-In', '2026-07-07 07:42:08', '2026-08-31 01:32:39', NULL),
('ORD-4697', 'Take Away', 'Customer Take Away', 13200, 'Selesai', 'Cash', 20000, 6800, NULL, 'Belum Bayar', NULL, 'Dine-In', '2026-07-29 03:09:10', '2026-08-31 01:32:39', NULL),
('ORD-5004', 'Take Away', 'Customer Take Away', 13200, 'Selesai', 'QRIS', 13200, 0, NULL, 'Belum Bayar', NULL, 'Takeaway', '2026-09-03 03:07:35', '2026-09-03 03:44:25', NULL),
('ORD-5134', 'Take Away', 'Customer Take Away', 13200, 'Selesai', 'Cash', 15000, 1800, NULL, 'Belum Bayar', NULL, 'Takeaway', '2026-09-03 02:41:00', '2026-09-03 02:41:11', NULL),
('ORD-7944', 'Take Away', 'Customer Take Away', 16500, 'Selesai', 'Cash', 20000, 3500, NULL, 'Belum Bayar', NULL, 'Dine-In', '2026-07-07 06:44:17', '2026-08-31 01:32:39', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `menu_id` varchar(50) DEFAULT NULL,
  `menu_name` varchar(200) NOT NULL,
  `price` int(11) DEFAULT 0,
  `quantity` int(11) DEFAULT 1,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `menu_id`, `menu_name`, `price`, `quantity`, `note`, `created_at`) VALUES
(20, 'ORD-1606', '18', 'Mie Yamin Spesial', 15000, 1, '', '2026-07-07 06:42:47'),
(21, 'ORD-7944', '18', 'Mie Yamin Spesial', 15000, 1, '', '2026-07-07 06:44:17'),
(22, 'ORD-2768', '18', 'Mie Yamin Spesial', 15000, 1, '', '2026-07-07 07:04:45'),
(23, 'ORD-4034', '18', 'Mie Yamin Spesial', 15000, 1, '', '2026-07-07 07:40:23'),
(24, 'ORD-4556', '18', 'Mie Yamin Spesial', 15000, 1, '', '2026-07-07 07:42:08'),
(25, 'ORD-4697', '18', 'Mie Yamin Spesial', 12000, 1, '', '2026-07-29 03:09:10'),
(26, 'ORD-5134', '18', 'Mie Yamin Spesial', 12000, 1, '', '2026-09-03 02:41:00'),
(27, 'ORD-5004', '18', 'Mie Yamin Spesial', 12000, 1, '', '2026-09-03 03:07:35');

-- --------------------------------------------------------

--
-- Struktur dari tabel `point_history`
--

CREATE TABLE `point_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `points` int(11) NOT NULL,
  `source` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `point_rewards`
--

CREATE TABLE `point_rewards` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `points` int(11) NOT NULL,
  `points_required` int(11) NOT NULL DEFAULT 0,
  `description` varchar(255) NOT NULL,
  `status` enum('Tersedia','Habis') DEFAULT 'Tersedia'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `point_rewards`
--

INSERT INTO `point_rewards` (`id`, `name`, `points`, `points_required`, `description`, `status`) VALUES
(6, 'Gratis Es Teh', 50, 0, 'Free iced tea', 'Tersedia');

-- --------------------------------------------------------

--
-- Struktur dari tabel `point_settings`
--

CREATE TABLE `point_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `earning_rate` int(11) DEFAULT 1000,
  `min_purchase` int(11) DEFAULT 10000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `point_settings`
--

INSERT INTO `point_settings` (`id`, `earning_rate`, `min_purchase`) VALUES
(1, 1000, 10000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `promos`
--

CREATE TABLE `promos` (
  `id` varchar(50) NOT NULL,
  `title` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `type` enum('Persentase','Nominal') DEFAULT 'Persentase',
  `period` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `usage_count` int(11) DEFAULT 0,
  `max_usage` int(11) DEFAULT NULL,
  `min_purchase` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `ratings`
--

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `rating_value` tinyint(4) DEFAULT 5,
  `comment` text DEFAULT NULL,
  `status` enum('Pending','Ditampilkan','Disembunyikan') DEFAULT 'Pending',
  `reply` text DEFAULT NULL,
  `order_id` varchar(50) DEFAULT NULL,
  `menu_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `ratings`
--

INSERT INTO `ratings` (`id`, `customer_name`, `rating_value`, `comment`, `status`, `reply`, `order_id`, `menu_id`, `created_at`) VALUES
(1, 'Bian', 5, 'enak bangettt', 'Pending', NULL, 'ORD-8009', NULL, '2026-06-05 16:29:00'),
(2, 'Budi Santoso', 5, 'Bakso Malangnya enak banget! Kuahnya gurih.', 'Ditampilkan', 'Terima kasih Pak Budi!', 'ORD-123', NULL, '2026-06-16 20:36:24'),
(3, 'Siti Aminah', 4, 'Mie Yaminnya pas manisnya. Mantap.', 'Ditampilkan', NULL, 'ORD-124', NULL, '2026-06-16 20:36:24'),
(4, 'Andi Wijaya', 2, 'Pangsitnya agak keras tadi.', 'Disembunyikan', NULL, 'ORD-125', NULL, '2026-06-16 20:36:24'),
(5, 'Anonym', 5, 'Pelayanan cepat dan ramah.', 'Pending', NULL, 'ORD-126', NULL, '2026-06-16 20:36:24'),
(6, 'Eko Prasetyo', 5, 'Tempatnya bersih dan nyaman.', 'Ditampilkan', 'Senang mendengarnya!', 'ORD-127', NULL, '2026-06-16 20:36:24');

-- --------------------------------------------------------

--
-- Struktur dari tabel `smart_tags`
--

CREATE TABLE `smart_tags` (
  `id` varchar(50) NOT NULL,
  `tag_type` enum('Meja','Takeaway','Delivery') DEFAULT 'Meja',
  `label_number` varchar(100) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `zone` varchar(50) DEFAULT NULL,
  `status` enum('Tersedia','Terisi','Reservasi') DEFAULT 'Tersedia',
  `smart_link` varchar(500) DEFAULT NULL,
  `last_scanned` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `smart_tags`
--

INSERT INTO `smart_tags` (`id`, `tag_type`, `label_number`, `capacity`, `zone`, `status`, `smart_link`, `last_scanned`, `created_at`) VALUES
('SPOT-ER9OJV', 'Takeaway', 'Coworking', NULL, 'RedBox', 'Tersedia', 'http://localhost:3001/?meja=Coworking&zona=RedBox', NULL, '2026-07-07 06:51:14'),
('TAG-OROVHE', 'Meja', '01', 4, 'Area Meja', 'Tersedia', 'http://localhost:3001/?meja=01&zona=Area%20Meja', NULL, '2026-07-27 07:17:39');

-- --------------------------------------------------------

--
-- Struktur dari tabel `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('Aktif','Cuti','Non-Aktif') DEFAULT 'Aktif',
  `join_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `staff`
--

INSERT INTO `staff` (`id`, `name`, `email`, `phone`, `status`, `join_date`, `created_at`) VALUES
(4, 'Fahreza Azhar Ramadhan', 'fahreza@gmail.com', '083130919334', 'Aktif', '2026-06-05', '2026-06-05 16:34:36'),
(5, 'Rizky Nurdiansyah', 'rizki@gmail.com', '083130919335', 'Aktif', '2026-06-05', '2026-06-05 16:35:01'),
(6, 'Ayesha Al Sidiq', 'arapmaklum@gmail.com', '083130919336', 'Aktif', '2026-06-05', '2026-06-05 16:36:00'),
(7, 'Nanda Cendikia', 'nanda@gmail.com', '083130919338', 'Aktif', '2026-06-05', '2026-06-05 16:36:23'),
(8, 'Zulfahmi', 'zulfahmi@gmail.com', '083130919339', 'Aktif', '2026-06-05', '2026-06-05 16:36:44');

-- --------------------------------------------------------

--
-- Struktur dari tabel `staff_schedules`
--

CREATE TABLE `staff_schedules` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `day` varchar(20) NOT NULL,
  `shift` enum('Pagi','Sore','Full','Custom') DEFAULT 'Pagi',
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `assigned_role` enum('Operasional','Support','Koki','Kasir') DEFAULT 'Operasional'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `stock_items`
--

CREATE TABLE `stock_items` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `qty` decimal(10,2) DEFAULT 0.00,
  `unit` varchar(20) DEFAULT 'pcs',
  `min_stock` decimal(10,2) DEFAULT 10.00,
  `status` enum('Aman','Menipis','Kritis','Habis') DEFAULT 'Aman',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expiry_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `stock_items`
--

INSERT INTO `stock_items` (`id`, `name`, `qty`, `unit`, `min_stock`, `status`, `created_at`, `expiry_date`) VALUES
(16, 'Bakso Maslahat', 86.00, 'pcs', 50.00, '', '2026-08-31 01:35:03', '2026-07-07');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `nim` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','kasir','koki','user') DEFAULT 'user',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `joined_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `points` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `nim`, `phone`, `password`, `role`, `status`, `joined_date`, `points`) VALUES
(1, 'Admin', 'admin@smartorder.com', NULL, NULL, 'admin123', 'admin', 'Active', '2026-06-05 13:37:11', 0),
(8, 'nanda', 'nanda@gmail.com', NULL, '081234565444', 'nanda123', 'user', 'Active', '2026-06-07 12:02:53', 50),
(10, 'Kasir', 'kasir@smartorder.com', NULL, NULL, 'kasir123', 'kasir', 'Active', '2026-08-21 07:19:36', 0),
(14, 'Koki', 'koki@smartorder.com', NULL, NULL, 'koki123', 'koki', 'Active', '2026-09-03 13:27:14', 0);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `menu_recipes`
--
ALTER TABLE `menu_recipes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_id` (`menu_id`),
  ADD KEY `stock_id` (`stock_id`);

--
-- Indeks untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_orders_id` (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indeks untuk tabel `point_history`
--
ALTER TABLE `point_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `point_rewards`
--
ALTER TABLE `point_rewards`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `point_settings`
--
ALTER TABLE `point_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `promos`
--
ALTER TABLE `promos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indeks untuk tabel `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_id` (`menu_id`);

--
-- Indeks untuk tabel `smart_tags`
--
ALTER TABLE `smart_tags`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indeks untuk tabel `staff_schedules`
--
ALTER TABLE `staff_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indeks untuk tabel `stock_items`
--
ALTER TABLE `stock_items`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `nim` (`nim`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT untuk tabel `menu_recipes`
--
ALTER TABLE `menu_recipes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT untuk tabel `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT untuk tabel `point_history`
--
ALTER TABLE `point_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `point_rewards`
--
ALTER TABLE `point_rewards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `staff_schedules`
--
ALTER TABLE `staff_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `menu_recipes`
--
ALTER TABLE `menu_recipes`
  ADD CONSTRAINT `menu_recipes_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `menu_recipes_ibfk_2` FOREIGN KEY (`stock_id`) REFERENCES `stock_items` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `point_history`
--
ALTER TABLE `point_history`
  ADD CONSTRAINT `point_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `staff_schedules`
--
ALTER TABLE `staff_schedules`
  ADD CONSTRAINT `staff_schedules_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
