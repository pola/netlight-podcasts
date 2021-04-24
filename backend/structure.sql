CREATE TABLE `account` (
  `id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `timestampRegistered` bigint(30) NOT NULL,
  `timestampSeen` bigint(30) NOT NULL,
  `isAdmin` tinyint(1) NOT NULL,
  `isRemoved` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `logPodcastTokenAudio` (
  `id` int(11) NOT NULL,
  `timestamp` bigint(30) NOT NULL,
  `ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `episode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `logPodcastTokenRss` (
  `id` int(11) NOT NULL,
  `timestamp` bigint(30) NOT NULL,
  `ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `logPodcastVisit` (
  `id` int(11) NOT NULL,
  `timestamp` bigint(30) NOT NULL,
  `ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `podcast` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
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

ALTER TABLE `logPodcastTokenAudio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `token` (`token`),
  ADD KEY `episode` (`episode`);

ALTER TABLE `logPodcastTokenRss`
  ADD PRIMARY KEY (`id`),
  ADD KEY `token` (`token`);

ALTER TABLE `logPodcastVisit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account` (`account`),
  ADD KEY `podcast` (`podcast`);

ALTER TABLE `podcast`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

ALTER TABLE `podcastEpisode`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `podcast` (`podcast`,`slug`);

ALTER TABLE `podcastToken`
  ADD PRIMARY KEY (`token`),
  ADD KEY `account` (`account`),
  ADD KEY `podcast` (`podcast`);


ALTER TABLE `logPodcastTokenAudio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `logPodcastTokenRss`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `logPodcastVisit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `logPodcastTokenAudio`
  ADD CONSTRAINT `logPodcastTokenAudio_ibfk_2` FOREIGN KEY (`token`) REFERENCES `podcastToken` (`token`),
  ADD CONSTRAINT `logPodcastTokenAudio_ibfk_3` FOREIGN KEY (`episode`) REFERENCES `podcastEpisode` (`id`);

ALTER TABLE `logPodcastTokenRss`
  ADD CONSTRAINT `logPodcastTokenRss_ibfk_2` FOREIGN KEY (`token`) REFERENCES `podcastToken` (`token`);

ALTER TABLE `logPodcastVisit`
  ADD CONSTRAINT `logPodcastVisit_ibfk_1` FOREIGN KEY (`account`) REFERENCES `account` (`id`),
  ADD CONSTRAINT `logPodcastVisit_ibfk_2` FOREIGN KEY (`podcast`) REFERENCES `podcast` (`id`);

ALTER TABLE `podcastEpisode`
  ADD CONSTRAINT `podcastEpisode_ibfk_1` FOREIGN KEY (`podcast`) REFERENCES `podcast` (`id`);

ALTER TABLE `podcastToken`
  ADD CONSTRAINT `podcastToken_ibfk_1` FOREIGN KEY (`account`) REFERENCES `account` (`id`),
  ADD CONSTRAINT `podcastToken_ibfk_2` FOREIGN KEY (`podcast`) REFERENCES `podcast` (`id`);
COMMIT;
