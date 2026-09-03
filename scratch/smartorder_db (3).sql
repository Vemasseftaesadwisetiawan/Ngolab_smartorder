-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 26 Jun 2026 pada 10.42
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `menu_items`
--

INSERT INTO `menu_items` (`id`, `name`, `category`, `price`, `description`, `stock`, `status`, `image_url`, `displayed`, `created_at`) VALUES
(11, 'Mie Yamin Spesial', 'Makanan', 15000, 'Mie dengan toping enak', 47, 'Tersedia', '/uploads/1781626368956-638838391.jpg', 1, '2026-06-16 16:12:48'),
(13, 'Es Teh Manis', 'Minuman', 5000, 'Es teh segar', 47, 'Tersedia', '/uploads/1781626541846-196806734.jpg', 1, '2026-06-16 16:15:41');

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

--
-- Dumping data untuk tabel `menu_recipes`
--

INSERT INTO `menu_recipes` (`id`, `menu_id`, `stock_id`, `amount`) VALUES
(12, 11, 12, 1.00);

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
  `order_type` enum('Dine-In','Takeaway','Delivery') DEFAULT 'Dine-In',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `orders`
--

INSERT INTO `orders` (`id`, `destination_label`, `customer_name`, `total`, `status`, `payment_method`, `amount_paid`, `change_amount`, `order_type`, `created_at`, `updated_at`, `user_id`) VALUES
('KIOSK-1780947787212-946', 'KiosK', 'Pelanggan Kiosk #71', 30000, 'Selesai', 'QRIS', 30000, 0, '', '2026-06-08 19:43:06', '2026-06-16 20:03:41', NULL),
('KIOSK-1780947866100-412', 'KiosK', 'Pelanggan Kiosk #10', 33000, 'Selesai', 'QRIS', 33000, 0, '', '2026-06-08 19:44:25', '2026-06-16 20:03:39', NULL),
('KIOSK-1780948128362-886', 'KiosK', 'Pelanggan Kiosk #26', 15000, 'Selesai', 'QRIS', 15000, 0, '', '2026-06-08 19:48:47', '2026-06-16 20:03:31', NULL),
('ORD-1058', 'Coworking (Lt 4 Fakultas Ilmu Terapan)', 'ss', 23000, 'Selesai', 'GoPay', 23000, 0, '', '2026-06-07 18:31:46', '2026-06-07 18:32:27', NULL),
('ORD-1818', 'Coworking (Lt 4 Fakultas Ilmu Terapan)', 'sef', 15000, 'Selesai', 'GoPay', 15000, 0, '', '2026-06-07 16:30:00', '2026-06-16 20:03:46', NULL),
('ORD-1927', 'Take Away', 'Customer Take Away', 5500, 'Selesai', 'Cash', 6000, 500, '', '2026-06-16 20:15:55', '2026-06-16 20:19:22', NULL),
('ORD-2373', 'Take Away', 'Customer Take Away', 5500, 'Diproses', 'Cash', 10000, 4500, '', '2026-06-16 20:07:30', '2026-06-16 20:09:23', NULL),
('ORD-3536', 'Meja 0', 'Brian', 12000, 'Selesai', 'OVO', 12000, 0, '', '2026-06-05 17:26:34', '2026-06-05 17:29:00', NULL),
('ORD-3752', 'Take Away', 'Customer Take Away', 16500, 'Selesai', 'Cash', 20000, 3500, '', '2026-06-16 20:10:22', '2026-06-16 20:29:25', NULL),
('ORD-4229', 'Take Away', 'Customer Take Away', 16500, 'Selesai', 'Cash', 20000, 3500, '', '2026-06-16 20:02:45', '2026-06-16 20:03:16', NULL),
('ORD-6363', 'Take Away', 'Customer Take Away', 16500, 'Selesai', 'Cash', 20000, 3500, '', '2026-06-16 20:01:23', '2026-06-16 20:03:27', NULL),
('ORD-6647', 'Take Away', 'Customer Take Away', 5500, 'Selesai', 'Cash', 7000, 1500, '', '2026-06-16 20:12:53', '2026-06-16 20:27:45', NULL),
('ORD-7440', 'Coworking (Lt 4 Fakultas Ilmu Terapan)', 'Nanda', 18000, 'Selesai', 'QRIS', 18000, 0, '', '2026-06-07 16:08:18', '2026-06-07 16:09:01', NULL),
('ORD-8009', 'Meja 0', 'Bian', 15000, 'Selesai', 'GoPay', 15000, 0, '', '2026-06-05 16:14:10', '2026-06-05 16:14:42', NULL),
('ORD-8246', 'Meja 0', 'Godam', 12000, 'Selesai', 'QRIS', 12000, 0, '', '2026-06-05 17:31:54', '2026-06-05 17:32:23', NULL),
('ORD-9596', 'Coworking (Lt 4 Fakultas Ilmu Terapan)', 'sef', 15000, 'Selesai', 'GoPay', 15000, 0, '', '2026-06-07 16:27:50', '2026-06-07 16:29:40', NULL);

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
(1, 'ORD-8009', '8', 'Bakso Malang', 15000, 1, 'Kuahnya banyakin ya', '2026-06-05 16:14:10'),
(2, 'ORD-3536', '8', 'Bakso Malang', 15000, 1, '', '2026-06-05 17:26:34'),
(3, 'ORD-8246', '8', 'Bakso Malang', 15000, 1, '', '2026-06-05 17:31:54'),
(5, 'ORD-7440', '9', 'Mie Yamin Spesial', 18000, 1, '', '2026-06-07 16:08:18'),
(6, 'ORD-9596', '8', 'Bakso Malang', 15000, 1, '', '2026-06-07 16:27:50'),
(7, 'ORD-1818', '8', 'Bakso Malang', 15000, 1, '', '2026-06-07 16:30:00'),
(8, 'ORD-1058', 'ag-1779568926193', 'Ayam Bakar', 23000, 1, '', '2026-06-07 18:31:46'),
(9, 'KIOSK-1780947787212-946', '10', 'Nasi Goreng', 15000, 2, '', '2026-06-08 19:43:06'),
(10, 'KIOSK-1780947866100-412', '9', 'Mie Yamin Spesial', 18000, 1, '', '2026-06-08 19:44:25'),
(11, 'KIOSK-1780947866100-412', '8', 'Bakso Malang', 15000, 1, '', '2026-06-08 19:44:25'),
(12, 'KIOSK-1780948128362-886', '10', 'Nasi Goreng', 15000, 1, '', '2026-06-08 19:48:47'),
(13, 'ORD-6363', '11', 'Mie Yamin Spesial', 15000, 1, '', '2026-06-16 20:01:23'),
(14, 'ORD-4229', '11', 'Mie Yamin Spesial', 15000, 1, '', '2026-06-16 20:02:45'),
(15, 'ORD-2373', '13', 'Es Teh Manis', 5000, 1, '', '2026-06-16 20:07:30'),
(16, 'ORD-3752', '11', 'Mie Yamin Spesial', 15000, 1, '', '2026-06-16 20:10:22'),
(17, 'ORD-6647', '13', 'Es Teh Manis', 5000, 1, '', '2026-06-16 20:12:53'),
(18, 'ORD-1927', '13', 'Es Teh Manis', 5000, 1, '', '2026-06-16 20:15:55');

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

--
-- Dumping data untuk tabel `point_history`
--

INSERT INTO `point_history` (`id`, `user_id`, `customer_name`, `points`, `source`, `created_at`) VALUES
(1, 7, 'Test User', 10, 'Test Earning script', '2026-06-07 13:54:45'),
(2, 7, 'Test User', 25, 'Transaksi Order: ORD-TEST-9715', '2026-06-07 15:45:11'),
(3, 8, 'nanda', 50, 'Manual Adjustment (Admin)', '2026-06-16 20:23:37');

-- --------------------------------------------------------

--
-- Struktur dari tabel `point_rewards`
--

CREATE TABLE `point_rewards` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `points` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `status` enum('Tersedia','Habis') DEFAULT 'Tersedia'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `point_rewards`
--

INSERT INTO `point_rewards` (`id`, `name`, `points`, `description`, `status`) VALUES
(5, 'Gantungan Kunci', 50, 'Gantungan kunci lucu', 'Tersedia');

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

--
-- Dumping data untuk tabel `promos`
--

INSERT INTO `promos` (`id`, `title`, `code`, `discount`, `type`, `period`, `status`, `usage_count`, `max_usage`, `min_purchase`, `created_at`) VALUES
('t4xsn6r2o', 'Diskon Pelajar', 'PELAJAR5K', 5000.00, 'Persentase', '60601-02-20 - 60630-02-20', 'Active', 0, NULL, 0, '2026-06-16 20:37:52');

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
(1, 'Bian', 5, 'enak bangettt', '', NULL, 'ORD-8009', NULL, '2026-06-05 16:29:00'),
(2, 'Budi Santoso', 5, 'Bakso Malangnya enak banget! Kuahnya gurih.', 'Ditampilkan', 'Terima kasih Pak Budi!', 'ORD-123', NULL, '2026-06-16 20:36:24'),
(3, 'Siti Aminah', 4, 'Mie Yaminnya pas manisnya. Mantap.', 'Ditampilkan', NULL, 'ORD-124', 11, '2026-06-16 20:36:24'),
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
  `label_number` int(11) DEFAULT NULL,
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
('SPOT-MMNDC4', 'Takeaway', 0, NULL, 'Lt 4 Fakultas Ilmu Terapan', 'Tersedia', 'http://localhost:3001/?meja=Coworking&zona=Lt%204%20Fakultas%20Ilmu%20Terapan', NULL, '2026-06-07 12:32:43'),
('TAG-ZMHPYW', 'Meja', 0, 4, 'Area Meja', 'Tersedia', 'http://localhost:3001/?meja=TABLE-01&zona=Area%20Meja', NULL, '2026-06-16 20:41:49');

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

--
-- Dumping data untuk tabel `staff_schedules`
--

INSERT INTO `staff_schedules` (`id`, `staff_id`, `day`, `shift`, `start_time`, `end_time`, `assigned_role`) VALUES
(1, 4, 'Senin', 'Custom', '08:00:00', '16:00:00', 'Operasional');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `stock_items`
--

INSERT INTO `stock_items` (`id`, `name`, `qty`, `unit`, `min_stock`, `status`, `created_at`) VALUES
(6, 'Bakso Maslahat', 20.00, 'pcs', 50.00, 'Kritis', '2026-06-05 14:57:50'),
(7, 'Bakso Semar', 100.00, 'pcs', 50.00, 'Aman', '2026-06-05 14:58:20'),
(8, 'Pangsit Kuncup', 100.00, 'pcs', 50.00, 'Aman', '2026-06-07 16:00:02'),
(9, 'Pangsit Gulung', 100.00, 'pcs', 50.00, 'Aman', '2026-06-07 16:00:28'),
(10, 'Tahu Baso', 100.00, 'pcs', 50.00, 'Aman', '2026-06-07 16:00:50'),
(11, 'Siomay Ayam', 100.00, 'pcs', 50.00, 'Aman', '2026-06-07 16:01:10'),
(12, 'Mie Kuning', 97.00, 'pcs', 50.00, 'Aman', '2026-06-07 16:03:00'),
(14, 'Cokelat Bubuk', 8.00, 'kg', 2.00, 'Aman', '2026-06-16 19:53:31');

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
  `status` enum('Active','Aktif','Inactive','Non-Aktif') DEFAULT 'Active',
  `joined_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `points` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `nim`, `phone`, `password`, `role`, `status`, `joined_date`, `points`) VALUES
(1, 'Admin', 'admin@smartorder.com', NULL, NULL, 'admin123', 'admin', 'Active', '2026-06-05 13:37:11', 0),
(5, 'dapur', 'dapur@smartorder.com', NULL, NULL, 'Password123', 'koki', 'Active', '2026-06-05 16:37:45', 0),
(6, 'ops', 'ops@smartorder.com', NULL, NULL, 'Password123', 'kasir', 'Active', '2026-06-05 16:38:04', 0),
(7, 'Test User', 'test@test.com', NULL, NULL, 'password123', 'user', 'Active', '2026-06-07 12:01:42', 35),
(8, 'nanda', 'nanda@gmail.com', NULL, '081234565444', 'nanda123', 'user', 'Active', '2026-06-07 12:02:53', 50);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT untuk tabel `menu_recipes`
--
ALTER TABLE `menu_recipes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT untuk tabel `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT untuk tabel `point_history`
--
ALTER TABLE `point_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `point_rewards`
--
ALTER TABLE `point_rewards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
