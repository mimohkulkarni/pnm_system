-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 06, 2022 at 10:32 PM
-- Server version: 8.0.31
-- PHP Version: 7.4.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skzqsaen_pnm`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'OPERATING'),
(2, 'RPF'),
(3, 'ELECTRICAL');

-- --------------------------------------------------------

--
-- Table structure for table `meeting`
--

CREATE TABLE `meeting` (
  `id` int NOT NULL,
  `name` varchar(500) NOT NULL,
  `meeting_date` date NOT NULL,
  `union_id` int NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `meeting`
--

INSERT INTO `meeting` (`id`, `name`, `meeting_date`, `union_id`, `created_by`, `created_at`) VALUES
(1, '8 nov first half', '2022-11-06', 1, 1, '2022-11-08 21:24:41'),
(2, '10 nov first half', '2022-11-10', 1, 1, '2022-11-09 22:07:28'),
(3, 'test', '2022-11-10', 2, 1, '2022-11-10 09:56:59'),
(4, '15 nov NRMU', '2022-11-15', 1, 1, '2022-11-14 17:39:27'),
(5, '10 nov first half1', '2022-11-25', 1, 1, '2022-11-24 20:38:41'),
(6, '26 nov first half', '2022-11-26', 1, 1, '2022-11-25 18:15:20'),
(7, '2 dec first half', '2022-12-02', 1, 1, '2022-12-01 18:30:20'),
(8, '12 nov ', '2022-12-09', 1, 1, '2022-12-06 08:44:46'),
(9, '6th NRMU Meeting ', '2022-12-15', 1, 1, '2022-12-06 17:14:43'),
(10, 'test', '2022-12-22', 1, 1, '2022-12-08 19:57:30');

-- --------------------------------------------------------

--
-- Table structure for table `remarks`
--

CREATE TABLE `remarks` (
  `id` int NOT NULL,
  `request_id` int NOT NULL,
  `meeting_remarks` int NOT NULL DEFAULT '0',
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL,
  `remark` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `remarks`
--

INSERT INTO `remarks` (`id`, `request_id`, `meeting_remarks`, `created_by`, `created_at`, `remark`) VALUES
(1, 2, 0, 2, '2022-11-08 14:47:51', 'test'),
(2, 2, 0, 2, '2022-11-08 14:48:09', 'test 2'),
(3, 2, 0, 2, '2022-11-08 14:48:24', 'approved'),
(4, 2, 0, 3, '2022-11-08 14:51:09', 'test forward'),
(5, 2, 0, 4, '2022-11-08 14:51:29', 'approved'),
(6, 2, 1, 1, '2022-11-08 14:51:29', 'approved'),
(7, 4, 0, 2, '2022-11-09 22:27:50', 'deprtment needs to be changed'),
(8, 4, 0, 2, '2022-11-09 22:28:34', 'department approved'),
(9, 4, 0, 3, '2022-11-09 22:33:49', 'needs to be forwarded'),
(10, 4, 0, 4, '2022-11-09 22:35:44', 'approved, please close'),
(11, 4, 0, 3, '2022-11-09 22:44:45', 'one more remark'),
(12, 7, 0, 3, '2022-11-10 18:00:06', 'test'),
(14, 7, 0, 4, '2022-11-10 18:01:48', 'approved'),
(15, 8, 0, 2, '2022-11-14 18:04:42', 'xyz dpo'),
(16, 8, 0, 3, '2022-11-14 18:06:18', 'forwarded2'),
(17, 8, 0, 4, '2022-11-14 18:06:50', 'approved'),
(18, 25, 0, 2, '2022-11-25 18:31:59', 'department approved'),
(19, 5, 0, 2, '2022-11-25 18:46:43', 'department approved'),
(20, 25, 0, 3, '2022-11-25 18:49:52', 'forwarded'),
(21, 25, 0, 4, '2022-11-25 18:55:54', 'approved, please close'),
(22, 25, 0, 4, '2022-11-25 18:56:11', '2nd remark'),
(23, 26, 0, 2, '2022-12-01 18:50:47', 'department set'),
(24, 26, 0, 3, '2022-12-01 18:52:08', 'forwarded please check 50'),
(25, 26, 0, 4, '2022-12-01 18:56:27', 'approved, admin please close the item'),
(26, 26, 0, 4, '2022-12-01 18:57:31', 'this is 2nd remark'),
(27, 27, 0, 2, '2022-12-06 09:01:04', 'rejected'),
(28, 27, 0, 4, '2022-12-06 09:42:50', 'test'),
(29, 27, 0, 3, '2022-12-06 09:43:03', 'testing'),
(30, 27, 0, 4, '2022-12-06 09:43:26', 'test 2');

-- --------------------------------------------------------

--
-- Table structure for table `request`
--

CREATE TABLE `request` (
  `id` int NOT NULL,
  `meeting_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` varchar(500) NOT NULL,
  `filepath` varchar(1000) DEFAULT NULL,
  `created_by` int NOT NULL,
  `open` int NOT NULL DEFAULT '1',
  `approved` int NOT NULL DEFAULT '0',
  `forwarded` int NOT NULL DEFAULT '0',
  `category_id` varchar(100) DEFAULT NULL,
  `category_set_by` int DEFAULT NULL,
  `prev_meeting` varchar(100) DEFAULT NULL,
  `sent_to` varchar(100) DEFAULT NULL,
  `union_id` int NOT NULL,
  `freeze` int NOT NULL DEFAULT '0',
  `closed_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `closed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `request`
--

INSERT INTO `request` (`id`, `meeting_id`, `title`, `description`, `filepath`, `created_by`, `open`, `approved`, `forwarded`, `category_id`, `category_set_by`, `prev_meeting`, `sent_to`, `union_id`, `freeze`, `closed_by`, `created_at`, `closed_at`) VALUES
(2, 1, 'flow check', 'flow check', '', 5, 0, 1, 0, '1,3', 2, NULL, NULL, 1, 0, 1, '2022-11-08 14:40:24', '2022-11-08 23:51:08'),
(3, 8, 'test request 1 ', 'test request desc 1 ', '', 1, 1, 0, 0, '1', 1, NULL, '3', 1, 0, NULL, '2022-11-08 22:08:26', NULL),
(4, 2, 'new flow testing', 'new flow testing desc', '', 5, 0, 1, 0, '1,2', 2, NULL, NULL, 1, 0, 1, '2022-11-09 22:09:30', '2022-11-09 22:40:15'),
(5, 8, 'test 1', 'test 1', '', 5, 1, 1, 0, '1,3', 2, '8', '1,3', 1, 0, NULL, '2022-11-10 08:51:50', NULL),
(7, 8, 'mimoh', 'mimoh', '', 5, 1, 1, 0, '1,3', 2, NULL, NULL, 1, 0, NULL, '2022-11-10 17:50:44', NULL),
(8, 8, 'about arrears 1', 'testing1', '', 5, 1, 1, 1, '1,2', 2, '3,8', NULL, 1, 0, NULL, '2022-11-14 17:42:10', NULL),
(10, 8, 'final testing', 'final testing', '', 5, 1, 1, 0, '1', 2, '8', '4', 1, 0, NULL, '2022-11-18 13:31:47', NULL),
(25, 6, 'arriars of shaikh', 'arriars of HRA from aug to sept', 'public\\files\\Learning_path1669380568755.jpg', 5, 0, 1, 0, '1,3', 2, NULL, '3,4', 1, 0, 1, '2022-11-25 18:19:28', '2022-11-25 19:01:20'),
(26, 8, '1 dec item 1', 'test', 'public\\files\\Learning_path16693805687551669900002900.jpg', 5, 0, 1, 0, '1,3', 2, NULL, '3,4', 1, 0, 1, '2022-12-01 18:36:42', '2022-12-01 19:04:42'),
(27, 8, 'mimoh testing', 'test', 'files\\Mimoh-Kulkarni-new1670296509553.doc', 5, 1, 1, 0, '1,2,3', 2, '8', '3,4', 1, 0, NULL, '2022-12-06 08:45:09', NULL),
(32, 10, 'Arrears of Narottam Kumar', 'Arrears of Narottam Kumar of HRA', NULL, 5, 1, 0, 0, NULL, NULL, '2,10,9,8', NULL, 1, 0, NULL, '2022-12-06 17:35:48', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int NOT NULL,
  `emp_no` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `mobile_no` varchar(12) NOT NULL,
  `password` varchar(100) NOT NULL,
  `password_change` int NOT NULL,
  `level` enum('1','2','3','4','5') NOT NULL,
  `designation` varchar(100) NOT NULL,
  `active` enum('0','1') NOT NULL,
  `category_id` int DEFAULT NULL,
  `union_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `last_login` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `emp_no`, `first_name`, `last_name`, `mobile_no`, `password`, `password_change`, `level`, `designation`, `active`, `category_id`, `union_id`, `created_by`, `last_login`) VALUES
(1, 'admin', 'Mimoh1', 'Kulkarni2', '12345', '123', 0, '1', 'PNM Officer', '1', NULL, NULL, 1, '2022-11-04 16:42:01'),
(2, 'dpo', 'Mimoh2', 'Kulkarni2', '12345', '123', 0, '2', 'DPO', '1', NULL, NULL, 1, '2022-11-08 09:59:36'),
(3, 'os', 'Mimoh3', 'Kulkarni3', '12345', '123', 0, '3', 'BO', '1', 1, NULL, 1, '2022-11-08 09:59:36'),
(4, 'bo', 'Mimoh4', 'Kulkarni4', '12345', '123', 0, '4', 'OS', '1', 1, NULL, 1, '2022-11-08 09:59:36'),
(5, 'nrmu', 'Mimoh5', 'Kulkarni5', '12345', '123', 0, '5', 'NRMU', '1', NULL, 1, 1, '2022-11-08 09:59:36'),
(6, 'crms', 'Mimoh6', 'Kulkarni6', '12345', '123', 1, '5', 'CRMS', '1', NULL, 2, 1, '2022-11-08 09:59:36'),
(15, '123', 'Mimoh', 'Kulkarni', '8055680143', 'pass123', 1, '5', 'test', '1', NULL, 1, 1, '0000-00-00 00:00:00'),
(16, 'dpo', 'Mimoh2', 'Mimoh2', '1234567890', 'pass123', 1, '2', 'DPO', '1', NULL, NULL, 1, '0000-00-00 00:00:00'),
(17, '1234567989', 'xxx', 'yyy', '1234567891', 'pass123', 1, '3', 'OS', '1', 1, NULL, 1, '0000-00-00 00:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `meeting`
--
ALTER TABLE `meeting`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_meeting_created_by` (`created_by`);

--
-- Indexes for table `remarks`
--
ALTER TABLE `remarks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request`
--
ALTER TABLE `request`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`created_by`),
  ADD KEY `closed_by` (`closed_by`),
  ADD KEY `FK_category_set_by` (`category_set_by`),
  ADD KEY `FK_meeting_id` (`meeting_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_user_category_id` (`category_id`),
  ADD KEY `FK_user_created_by` (`created_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `meeting`
--
ALTER TABLE `meeting`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `remarks`
--
ALTER TABLE `remarks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `request`
--
ALTER TABLE `request`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `meeting`
--
ALTER TABLE `meeting`
  ADD CONSTRAINT `FK_meeting_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `request`
--
ALTER TABLE `request`
  ADD CONSTRAINT `FK_category_set_by` FOREIGN KEY (`category_set_by`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `FK_meeting_id` FOREIGN KEY (`meeting_id`) REFERENCES `meeting` (`id`),
  ADD CONSTRAINT `request_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `request_ibfk_2` FOREIGN KEY (`closed_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `FK_user_category_id` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `FK_user_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
