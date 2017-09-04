CREATE DATABASE  IF NOT EXISTS `tundra_forum`;
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
  `join_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  `last_poster_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `post_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  `post_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `edit_date` datetime DEFAULT NULL,
  PRIMARY KEY (`post_id`),
  KEY `IDX_thread_id` (`thread_id`),
  KEY `IDX_author` (`author`),
  CONSTRAINT `FK_posts_author` FOREIGN KEY (`author`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_posts_thread_id` FOREIGN KEY (`thread_id`) REFERENCES `threads` (`thread_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `users` WRITE;
INSERT INTO `users` VALUES (1,'Alex','lSCX4ALiRaxjvoe+','CS5KwYj3kCHJ+vnREA74Pg==','pJfc/rCTkFqESdmBIVu+OXVAXKYlaZ3kyoqqxJu2+e0=','yolo@gmail.com',100,0,0,'2017-04-01 01:54:34','2017-04-01 01:54:34','Fizz Main','c997d247aa3344bae6eb6e4c2db71075ffa29e5329bf864839c9438340058db3ad67dd477faa951b83da2c06ecf70d22'),(2,'Ben','g8lf44vqbIOazK+N4+xXmQ==','mDn0wSxBWnKJ11n3+xUUvg==','d9SbOdv2xHMJZdKNKC2JY61XMFr0bWj/6Li+eRAhzEo=','swag@gmail.com',0,0,0,'2017-04-01 01:54:34','2017-04-01 01:54:34',NULL,'92d93443b7522c5905ecfcc436b947a1a181478063f638fbb074b2cb65057e370fc0939a0681bac6f69a16e67b724244');
UNLOCK TABLES;

LOCK TABLES `boards` WRITE;
INSERT INTO `boards` VALUES (1,'Introductions','Introduce yourself',2,5,NULL),(2,'General Discussion','Talk about anything',0,0,NULL);
UNLOCK TABLES;

LOCK TABLES `threads` WRITE;
INSERT INTO `threads` VALUES (1,1,1,1,'2017-04-01 08:54:34','2017-04-01 08:54:34','Hello everyone!',2,0),(2,1,2,2,'2017-04-01 08:54:34','2017-04-01 08:54:34','Ben here',3,0);
UNLOCK TABLES;

LOCK TABLES `posts` WRITE;
INSERT INTO `posts` VALUES (1,1,1,'I am new here, and this post is also the very first post for a test case.',1,'::ffff:127.0.0.1','2017-04-01 08:54:34',NULL),(2,2,2,'This account\'s name is Ben',1,'::ffff:127.0.0.1','2017-04-01 08:54:34',NULL),(3,1,1,'This is the second post in the first thread that was made',0,'::ffff:127.0.0.1','2017-04-01 08:54:34',NULL),(4,2,1,'Hello there Ben, my name is Alex. Nice to meet you!',0,'::ffff:127.0.0.1','2017-04-01 08:54:35',NULL),(5,2,2,'Hey thanks Alex.',0,'::ffff:127.0.0.1','2017-04-01 08:54:35',NULL);
UNLOCK TABLES;
