CREATE DATABASE IF NOT EXISTS `tundra_forum`;
USE `tundra_forum`;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(24) NOT NULL,
  `password_content` varchar(96) NOT NULL,
  `password_tag` varchar(96) NOT NULL,
  `password_iv` varchar(96) NOT NULL,
  `email` varchar(50) NOT NULL,
  `permission` int(11) unsigned NOT NULL DEFAULT '0',
  `post_count` int(11) unsigned NOT NULL DEFAULT '0',
  `thread_count` int(11) unsigned NOT NULL DEFAULT '0',
  `join_date` datetime DEFAULT NULL,
  `last_seen` datetime DEFAULT NULL,
  `title` varchar(30) DEFAULT NULL,
  `token` varchar(96) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UNI_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `boards`;
CREATE TABLE `boards` (
  `board_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `thread_count` int(11) unsigned DEFAULT '0',
  `post_count` int(11) unsigned DEFAULT '0',
  `icon` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`board_id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `threads`;
CREATE TABLE `threads` (
  `thread_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `board_id` int(11) unsigned NOT NULL,
  `author` int(11) unsigned NOT NULL,
  `last_poster_id` int(11) NOT NULL,
  `last_poster_date` datetime DEFAULT NULL,
  `post_date` datetime DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `post_count` int(11) unsigned NOT NULL DEFAULT '1',
  `closed` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`thread_id`),
  KEY `IDX_board_id` (`board_id`),
  KEY `IDX_threads_author` (`author`),
  CONSTRAINT `FK_threads_author` FOREIGN KEY (`author`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_threads_board_id` FOREIGN KEY (`board_id`) REFERENCES `boards` (`board_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `post_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `thread_id` int(11) unsigned NOT NULL,
  `author` int(11) unsigned NOT NULL,
  `post` longtext NOT NULL,
  `first_post` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `ip_address` varchar(20) NOT NULL,
  `post_date` datetime DEFAULT NULL,
  `edit_date` datetime DEFAULT NULL,
  PRIMARY KEY (`post_id`),
  KEY `IDX_thread_id` (`thread_id`),
  KEY `IDX_author` (`author`),
  CONSTRAINT `FK_posts_author` FOREIGN KEY (`author`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_posts_thread_id` FOREIGN KEY (`thread_id`) REFERENCES `threads` (`thread_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(24) NOT NULL,
  `password_content` varchar(96) NOT NULL,
  `password_tag` varchar(96) NOT NULL,
  `password_iv` varchar(96) NOT NULL,
  `email` varchar(50) NOT NULL,
  `permission` int(11) unsigned NOT NULL DEFAULT '0',
  `post_count` int(11) unsigned NOT NULL DEFAULT '0',
  `thread_count` int(11) unsigned NOT NULL DEFAULT '0',
  `join_date` datetime DEFAULT NULL,
  `last_seen` datetime DEFAULT NULL,
  `title` varchar(30) DEFAULT NULL,
  `token` varchar(96) DEFAULT NULL,
  `userscol` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UNI_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
