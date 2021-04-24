SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `account` (
  `id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `timestampRegistered` bigint(30) NOT NULL,
  `timestampSeen` bigint(30) NOT NULL,
  `isAdmin` tinyint(1) NOT NULL,
  `isRemoved` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `podcast` (
  `id` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci NOT NULL,
  `isVisible` tinyint(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `podcastEpisode` (
  `id` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `podcast` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `fileName` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fileContent` longblob,
  `fileMimeType` enum('audio/mpeg') COLLATE utf8_unicode_ci DEFAULT NULL,
  `fileSize` bigint(30) DEFAULT NULL,
  `published` bigint(30) DEFAULT NULL,
  `isVisible` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `podcastToken` (
  `token` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `podcast` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `account` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `isRemoved` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;


ALTER TABLE `account`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `podcast`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

ALTER TABLE `podcastEpisode`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `podcast` (`podcast`,`slug`);

ALTER TABLE `podcastToken`
  ADD PRIMARY KEY (`token`),
  ADD KEY `account` (`account`);


ALTER TABLE `podcastEpisode`
  ADD CONSTRAINT `podcastEpisode_ibfk_1` FOREIGN KEY (`podcast`) REFERENCES `podcast` (`id`);

ALTER TABLE `podcastToken`
  ADD CONSTRAINT `podcastToken_ibfk_1` FOREIGN KEY (`account`) REFERENCES `account` (`id`);
COMMIT;