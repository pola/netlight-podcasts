SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `accounts` (
  `username` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `timestampRegistered` bigint(30) NOT NULL,
  `timestampSeen` bigint(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `podcast` (
  `id` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci NOT NULL,
  `isHidden` tinyint(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `podcastEpisode` (
  `id` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `podcast` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `duration` int(11) NOT NULL,
  `fileName` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `fileSize` int(11) NOT NULL,
  `published` bigint(30) NOT NULL,
  `isHidden` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `podcastToken` (
  `token` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `podcast` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(255) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `stream` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ip` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `userAgent` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dateStart` bigint(30) NOT NULL,
  `dateEnd` bigint(30) DEFAULT NULL,
  `state` enum('ONGOING','ENDED_OK','ENDED_CHANGE','ENDED_CRASH') COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `streams` (
  `id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `type` enum('YOUTUBE','IFRAME','AZURE','LINKS') COLLATE utf8_unicode_ci DEFAULT NULL,
  `data` json DEFAULT NULL,
  `linkList` json NOT NULL,
  `start` bigint(30) NOT NULL,
  `protection` enum('OPEN','REQUIRE_ACCOUNT','REQUIRE_PASSWORD','REQUIRE_ACCOUNT_OR_PASSWORD') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'OPEN',
  `password` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `slackChannel` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `isHidden` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;


ALTER TABLE `accounts`
  ADD PRIMARY KEY (`username`);

ALTER TABLE `podcast`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

ALTER TABLE `podcastEpisode`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `podcast` (`podcast`,`slug`);

ALTER TABLE `podcastToken`
  ADD PRIMARY KEY (`token`),
  ADD UNIQUE KEY `podcast` (`podcast`,`username`);

ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stream` (`stream`),
  ADD KEY `username` (`username`);

ALTER TABLE `streams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);


ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `podcastEpisode`
  ADD CONSTRAINT `podcastEpisode_ibfk_1` FOREIGN KEY (`podcast`) REFERENCES `podcast` (`id`);

ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`stream`) REFERENCES `streams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `sessions_ibfk_2` FOREIGN KEY (`username`) REFERENCES `accounts` (`username`);
COMMIT;
