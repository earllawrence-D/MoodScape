-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 11, 2025 at 05:14 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `moodscape`
--

-- --------------------------------------------------------

--
-- Table structure for table `community_comments`
--

CREATE TABLE `community_comments` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `community_comments`
--

INSERT INTO `community_comments` (`id`, `post_id`, `user_id`, `content`, `created_at`, `updated_at`) VALUES
(3, 11, 7, 'bobo', '2025-12-11 03:58:15', '2025-12-11 03:58:15');

-- --------------------------------------------------------

--
-- Table structure for table `community_likes`
--

CREATE TABLE `community_likes` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `community_posts`
--

CREATE TABLE `community_posts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `category` varchar(255) NOT NULL DEFAULT 'General',
  `content` text NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `likes_count` int(11) DEFAULT 0,
  `upvotes` int(11) DEFAULT 0,
  `downvotes` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `community_posts`
--

INSERT INTO `community_posts` (`id`, `user_id`, `title`, `category`, `content`, `is_anonymous`, `likes_count`, `upvotes`, `downvotes`, `created_at`, `updated_at`) VALUES
(11, 7, 'DEPRESSION IS NOT A JOKE', 'General', 'HUUHUHUHUH', 0, 0, 0, 1, '2025-12-10 20:35:55', '2025-12-11 03:58:11'),
(12, 7, 'ahahahaha', 'Advice', 'haahahaha', 0, 0, 1, 0, '2025-12-11 05:40:16', '2025-12-11 05:40:18');

-- --------------------------------------------------------

--
-- Table structure for table `community_votes`
--

CREATE TABLE `community_votes` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('up','down') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `community_votes`
--

INSERT INTO `community_votes` (`id`, `post_id`, `user_id`, `type`, `created_at`, `updated_at`) VALUES
(5, 11, 7, 'down', '2025-12-10 20:35:59', '2025-12-11 03:58:11'),
(6, 12, 7, 'up', '2025-12-11 05:40:18', '2025-12-11 05:40:18');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedback`
--

INSERT INTO `feedback` (`id`, `user_id`, `message`, `rating`, `created_at`, `updated_at`) VALUES
(1, 7, 'yawaaaaaaaaaa', NULL, '2025-12-11 08:19:54', NULL),
(2, 7, 'pisteeeeeeee', NULL, '2025-12-11 14:14:20', NULL),
(3, 7, 'bn bhc', NULL, '2025-12-11 14:19:55', NULL),
(4, 7, 'aijsbcjs gbfsab dfhswg', NULL, '2025-12-11 14:23:36', NULL),
(5, 7, 'ygcgc', NULL, '2025-12-11 14:35:52', NULL),
(6, 7, 'dgfg', NULL, '2025-12-11 14:46:41', NULL),
(7, 7, 'dsgvdfg', NULL, '2025-12-11 14:47:49', NULL),
(8, 7, 'sucgydygf', NULL, '2025-12-11 15:02:15', NULL),
(9, 7, 'sdg', NULL, '2025-12-11 15:49:46', NULL),
(10, 7, 'vdvdf', NULL, '2025-12-11 15:53:45', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `feedbacks`
--

CREATE TABLE `feedbacks` (
  `id` int(11) NOT NULL,
  `message` text NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedbacks`
--

INSERT INTO `feedbacks` (`id`, `message`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 'xvcb', 7, '2025-12-11 15:32:24', '2025-12-11 15:32:24'),
(2, 'sdfdgf', 7, '2025-12-11 15:44:06', '2025-12-11 15:44:06');

-- --------------------------------------------------------

--
-- Table structure for table `harmful_word_log`
--

CREATE TABLE `harmful_word_log` (
  `id` int(11) NOT NULL,
  `journal_entry_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `word` varchar(255) NOT NULL,
  `context` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `harmful_word_log`
--

INSERT INTO `harmful_word_log` (`id`, `journal_entry_id`, `user_id`, `word`, `context`, `created_at`, `updated_at`) VALUES
(1, 31, NULL, 'end it', 'im gonna end it', '2025-12-07 04:41:06', '2025-12-07 04:41:06'),
(2, 32, NULL, 'kill myself', 'i wanna kill myself', '2025-12-07 04:41:21', '2025-12-07 04:41:21'),
(3, 34, NULL, 'kill myself', 'im gonna kill myself', '2025-12-07 05:09:43', '2025-12-07 05:09:43'),
(4, 38, NULL, 'cut myself', 'i wanna cut myself', '2025-12-07 05:12:46', '2025-12-07 05:12:46'),
(5, 41, NULL, 'kill myself', 'i wanna kill myself', '2025-12-07 05:22:41', '2025-12-07 05:22:41'),
(6, 45, NULL, 'end it', 'hello journal today im really depressed and thinking that maybe i should end it', '2025-12-07 06:04:54', '2025-12-07 06:04:54'),
(7, 53, 7, 'kill myself', 'im gonna kill myself', '2025-12-10 15:28:40', '2025-12-10 15:28:40'),
(8, 55, 7, 'hurt myself', 'hurt myself', '2025-12-10 15:47:07', '2025-12-10 15:47:07');

-- --------------------------------------------------------

--
-- Table structure for table `journals`
--

CREATE TABLE `journals` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `mood` varchar(50) DEFAULT NULL,
  `mood_score` int(11) DEFAULT NULL CHECK (`mood_score` >= 1 and `mood_score` <= 10),
  `ai_response` text DEFAULT NULL,
  `is_voice` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` longtext NOT NULL,
  `is_voice` tinyint(1) DEFAULT 0,
  `mood` varchar(50) DEFAULT 'neutral',
  `mood_score` float DEFAULT 5,
  `ai_response` longtext DEFAULT NULL,
  `ai_report` longtext DEFAULT NULL,
  `is_crisis` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `harmful_words` text DEFAULT NULL,
  `assigned_therapist_id` int(11) DEFAULT NULL,
  `contains_harmful` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `journal_entries`
--

INSERT INTO `journal_entries` (`id`, `user_id`, `content`, `is_voice`, `mood`, `mood_score`, `ai_response`, `ai_report`, `is_crisis`, `created_at`, `updated_at`, `harmful_words`, `assigned_therapist_id`, `contains_harmful`) VALUES
(1, 1, 'hi', 0, 'neutral', 5, NULL, NULL, 0, '2025-12-04 16:28:04', '2025-12-04 16:28:04', NULL, NULL, 0),
(2, 1, 'im kinda depressed today', 0, 'neutral', 10, NULL, NULL, 0, '2025-12-04 16:28:23', '2025-12-04 16:28:23', NULL, NULL, 0),
(3, 1, 'sdd', 0, 'neutral', 4, NULL, NULL, 0, '2025-12-04 16:37:39', '2025-12-04 16:37:39', NULL, NULL, 0),
(4, 1, 'sfsfsf', 0, 'neutral', 4, NULL, NULL, 0, '2025-12-04 16:43:03', '2025-12-04 16:43:03', NULL, NULL, 0),
(5, 1, 'im kinda sad today', 0, 'depressed', 2, NULL, NULL, 0, '2025-12-04 16:54:34', '2025-12-04 16:54:34', NULL, NULL, 0),
(6, 1, 'hi', 0, 'neutral', 3, NULL, NULL, 0, '2025-12-04 17:23:00', '2025-12-04 17:23:00', NULL, NULL, 0),
(7, 1, 'im sad', 0, 'depressed', 6, NULL, NULL, 0, '2025-12-04 17:23:12', '2025-12-04 17:23:12', NULL, NULL, 0),
(8, 1, 'im kinda sad right now', 0, 'depressed', 3, NULL, NULL, 0, '2025-12-04 17:25:48', '2025-12-04 17:25:48', NULL, NULL, 0),
(9, 1, 'hi', 0, 'neutral', 6, NULL, NULL, 0, '2025-12-04 17:34:30', '2025-12-04 17:34:30', NULL, NULL, 0),
(10, 1, 'hi', 0, 'neutral', 4, NULL, NULL, 0, '2025-12-04 18:04:58', '2025-12-04 18:04:58', NULL, NULL, 0),
(11, 1, 'help me im suffering with anxiety', 0, 'neutral', 4, NULL, NULL, 0, '2025-12-04 18:05:48', '2025-12-04 18:05:48', NULL, NULL, 0),
(12, 1, 'sad', 0, 'depressed', 10, NULL, NULL, 0, '2025-12-04 18:05:57', '2025-12-04 18:05:57', NULL, NULL, 0),
(13, 1, 'hihi can you hear me', 0, 'neutral', 1, NULL, NULL, 0, '2025-12-04 18:10:44', '2025-12-04 18:10:44', NULL, NULL, 0),
(14, 1, 'svfdv', 0, 'neutral', 7, NULL, NULL, 0, '2025-12-04 18:10:57', '2025-12-04 18:10:57', NULL, NULL, 0),
(15, 1, 'hi', 0, 'neutral', 2, NULL, NULL, 0, '2025-12-04 18:33:33', '2025-12-04 18:33:33', NULL, NULL, 0),
(16, 1, 'hello', 0, 'neutral', 7, NULL, NULL, 0, '2025-12-04 18:33:50', '2025-12-04 18:33:50', NULL, NULL, 0),
(17, 1, 'im sad', 0, 'depressed', 3, NULL, NULL, 0, '2025-12-04 18:36:45', '2025-12-04 18:36:45', NULL, NULL, 0),
(18, 1, 'im worried', 0, 'neutral', 7, NULL, NULL, 0, '2025-12-04 18:39:18', '2025-12-04 18:39:18', NULL, NULL, 0),
(19, 1, 'hi', 0, 'neutral', 1, NULL, NULL, 0, '2025-12-04 18:44:40', '2025-12-04 18:44:40', NULL, NULL, 0),
(20, 1, 'hi', 0, 'neutral', 10, NULL, NULL, 0, '2025-12-04 19:23:51', '2025-12-04 19:23:51', NULL, NULL, 0),
(21, 1, 'hi im sad', 0, 'depressed', 5, NULL, NULL, 0, '2025-12-04 19:26:17', '2025-12-04 19:26:17', NULL, NULL, 0),
(22, 1, 'day 3 of my mental health recovery after tragic events', 0, 'neutral', 7, NULL, NULL, 0, '2025-12-04 19:29:58', '2025-12-04 19:29:58', NULL, NULL, 0),
(23, 1, 'can you', 0, 'neutral', 7, NULL, NULL, 0, '2025-12-04 19:30:11', '2025-12-04 19:30:11', NULL, NULL, 0),
(24, 1, 'yaw', 0, 'neutral', 9, NULL, NULL, 0, '2025-12-04 19:30:24', '2025-12-04 19:30:24', NULL, NULL, 0),
(25, 1, 'Test entry from terminal', 0, 'neutral', 5, NULL, NULL, 0, '2025-12-05 02:51:39', '2025-12-05 02:51:39', NULL, NULL, 0),
(26, 3, 'im sad right now', 0, 'sad', 8, 'I’m really sorry you’re feeling this way. It can help to talk about what’s on your mind. If you’d like, I’m here to listen or offer some suggestions to lift your mood. You’re not alone in this.', 'Keep journaling to track your emotions!', 0, '2025-12-05 03:14:05', '2025-12-05 03:14:05', NULL, NULL, 0),
(27, 3, 'happy', 0, 'happy', 9, 'I\'m glad to hear that! How can I assist you today?', 'Keep journaling to track your emotions!', 0, '2025-12-05 03:19:39', '2025-12-05 03:19:39', NULL, NULL, 0),
(28, 3, 'exciterd because you worked', 0, 'excited', 9, 'Sounds like you’re buzzing with excitement! What’s got you so thrilled?', 'Keep journaling to track your emotions!', 0, '2025-12-05 03:21:40', '2025-12-05 03:21:40', NULL, NULL, 0),
(29, 2, 'im gonna kill myself', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-06 11:04:12', '2025-12-06 11:04:12', NULL, NULL, 0),
(30, 2, 'im gonna end it', 0, 'sad', 9, 'I’m really sorry you’re feeling like this. You don’t have to face these thoughts alone. It can help to reach out right now to someone you trust—a friend, family member, or counselor—and let them know what you’re going through. If you ever feel like you might act on these thoughts or are in immediate danger, please call your local emergency number (for example, 911 in the U.S.) or go to the nearest emergency department. If you’re in the U.S., you can also call or text 988 to connect with the Suicide and Crisis Lifeline. If you’re outside the U.S., you can find international hotlines here: https://findahelpline.com/, or search online for “suicide helpline” in your country. You deserve help and support, and people do want to help you through this. You’re not alone. ', 'Keep journaling to track your emotions!', 0, '2025-12-06 11:04:25', '2025-12-06 11:04:25', NULL, NULL, 0),
(31, 2, 'im gonna end it', 0, 'neutral', 5, 'I’m really sorry you\'re feeling this way. Your safety matters. If you feel unsafe, please talk to someone you trust or contact emergency services immediately.', 'Keep journaling to track your emotions!', 0, '2025-12-07 04:41:06', '2025-12-07 04:41:06', 'end it', NULL, 1),
(32, 2, 'i wanna kill myself', 0, 'neutral', 5, 'I’m really sorry you\'re feeling this way. Your safety matters. If you feel unsafe, please talk to someone you trust or contact emergency services immediately.', 'Keep journaling to track your emotions!', 0, '2025-12-07 04:41:21', '2025-12-07 04:41:21', 'kill myself', NULL, 1),
(33, 2, 'hey', 0, 'neutral', 5, 'Hello!  How can I help you today?', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:09:28', '2025-12-07 05:09:28', NULL, NULL, 0),
(34, 2, 'im gonna kill myself', 0, 'neutral', 5, 'I’m really sorry you\'re feeling this way. Your safety matters. If you feel unsafe, please talk to someone you trust or contact emergency services immediately.', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:09:43', '2025-12-07 05:09:43', 'kill myself', NULL, 1),
(35, 2, 'kill me pls', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:12:03', '2025-12-07 05:12:03', NULL, NULL, 0),
(36, 2, 'im sad', 0, 'sad', 8, 'I’m sorry you’re feeling this way.  It can help to talk about what’s on your mind or to do something small that brings a bit of comfort—like listening to a favorite song, taking a short walk, or writing down your thoughts.', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:12:20', '2025-12-07 05:12:20', NULL, NULL, 0),
(37, 2, 'happy', 0, 'happy', 9, 'That\'s great to hear!  Hope your day keeps getting better!', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:12:31', '2025-12-07 05:12:31', NULL, NULL, 0),
(38, 2, 'i wanna cut myself', 0, 'neutral', 5, 'I’m really sorry you\'re feeling this way. Your safety matters. If you feel unsafe, please talk to someone you trust or contact emergency services immediately.', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:12:46', '2025-12-07 05:12:46', 'cut myself', NULL, 1),
(39, 2, 'hey', 0, 'neutral', 5, 'Hey there!  How can I help you today?', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:19:55', '2025-12-07 05:19:55', NULL, NULL, 0),
(40, 2, 'angry', 0, 'angry', 8, 'I can sense that you’re feeling angry right now.  It can be tough to carry that weight.', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:20:07', '2025-12-07 05:20:07', NULL, NULL, 0),
(41, 3, 'i wanna kill myself', 0, 'neutral', 5, 'I’m really sorry you\'re feeling this way. Your safety matters. If you feel unsafe, please talk to someone you trust or contact emergency services immediately.', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:22:41', '2025-12-07 05:22:41', 'kill myself', NULL, 1),
(42, 3, 'angry', 0, 'angry', 9, 'I hear that you\'re feeling angry right now.  It can help to talk about what\'s bothering you—what\'s on your mind?', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:22:52', '2025-12-07 05:22:52', NULL, NULL, 0),
(43, 3, 'depressed', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:23:17', '2025-12-07 05:23:17', NULL, NULL, 0),
(44, 3, 'HI', 0, 'neutral', 5, 'Hello!  How can I assist you today?', 'Keep journaling to track your emotions!', 0, '2025-12-07 05:52:36', '2025-12-07 05:52:36', NULL, NULL, 0),
(45, 3, 'hello journal today im really depressed and thinking that maybe i should end it', 0, 'neutral', 5, 'I’m really sorry you\'re feeling this way. Your safety matters. If you feel unsafe, please talk to someone you trust or contact emergency services immediately.', 'Keep journaling to track your emotions!', 0, '2025-12-07 06:04:54', '2025-12-07 06:04:54', 'end it', NULL, 1),
(46, 3, 'hi', 0, 'neutral', 5, 'Hello!  How can I help you today?', 'Keep journaling to track your emotions!', 0, '2025-12-07 12:28:18', '2025-12-07 12:28:18', NULL, NULL, 0),
(47, 3, 'im depressed', 0, 'sad', 8, 'I’m really sorry you’re feeling this way.  It can help to talk about what’s on your mind or reach out to someone you trust.', 'Keep journaling to track your emotions!', 0, '2025-12-07 13:15:00', '2025-12-07 13:15:00', NULL, NULL, 0),
(48, 3, 'hey', 0, 'neutral', 5, 'Hey!  How can I help you today?', 'Keep journaling to track your emotions!', 0, '2025-12-07 15:01:36', '2025-12-07 15:01:36', NULL, NULL, 0),
(49, 3, 'hi', 0, 'happy', 6, 'Hello!  How can I help you today?', 'Keep journaling to track your emotions!', 0, '2025-12-07 17:03:15', '2025-12-07 17:03:15', NULL, NULL, 0),
(50, 2, 'im angry today because i accidentally deleted an important file', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-08 02:00:06', '2025-12-08 02:00:06', NULL, NULL, 0),
(51, 2, 'fef', 0, 'confused', 5, 'I’m not sure I understand what you mean by \"fef\"—could you give me a bit more context or clarify what you’re looking for?', 'Keep journaling to track your emotions!', 0, '2025-12-08 03:32:18', '2025-12-08 03:32:18', NULL, NULL, 0),
(52, 7, 'sad', 0, 'sad', 8, 'I’m really sorry you’re feeling this way.  It can help to talk about what’s on your mind or just share how you’re feeling.', 'Keep journaling to track your emotions!', 0, '2025-12-10 15:21:23', '2025-12-10 15:21:23', NULL, NULL, 0),
(53, 7, 'im gonna kill myself', 0, 'neutral', 5, 'I’m really sorry you\'re feeling this way. Your safety matters. If you feel unsafe, please talk to someone you trust or contact emergency services immediately.', 'Keep journaling to track your emotions!', 0, '2025-12-10 15:28:40', '2025-12-10 15:28:40', 'kill myself', NULL, 1),
(54, 7, 'i wanna die', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-10 15:44:21', '2025-12-10 15:44:21', NULL, NULL, 0),
(55, 7, 'hurt myself', 0, 'neutral', 5, 'I’m really sorry you\'re feeling this way. Your safety matters. If you feel unsafe, please talk to someone you trust or contact emergency services immediately.', 'Keep journaling to track your emotions!', 0, '2025-12-10 15:47:07', '2025-12-10 15:47:07', 'hurt myself', NULL, 1),
(56, 7, 'im sad', 0, 'sad', 7, 'I’m really sorry you’re feeling this way.  It can help to talk about what’s on your mind or to take a few deep breaths and give yourself a moment of pause.', 'Keep journaling to track your emotions!', 0, '2025-12-10 16:05:06', '2025-12-10 16:05:06', NULL, NULL, 0),
(57, 7, 'im angry', 0, 'angry', 8, 'I hear you—anger can feel overwhelming.  It might help to take a few slow breaths, write down what’s bothering you, or talk to someone you trust.', 'Keep journaling to track your emotions!', 0, '2025-12-10 16:11:04', '2025-12-10 16:11:04', NULL, NULL, 0),
(58, 7, 'assign me a therapist fuckkk', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-10 16:23:56', '2025-12-10 16:23:56', NULL, NULL, 0),
(59, 7, 'im angry', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-10 16:30:47', '2025-12-10 16:30:47', NULL, NULL, 0),
(60, 7, 'afcsdf', 0, 'neutral', 5, 'It looks like that might be a typo or random text.  How can I assist you today?', 'Keep journaling to track your emotions!', 0, '2025-12-10 17:17:57', '2025-12-10 17:17:57', NULL, NULL, 0),
(61, 7, 'angry', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-10 17:18:02', '2025-12-10 17:18:02', NULL, NULL, 0),
(62, 7, 'depressed', 0, 'sad', 8, 'I’m really sorry you’re feeling this way.  It sounds like you’re going through a tough time.', 'Keep journaling to track your emotions!', 0, '2025-12-10 17:18:10', '2025-12-10 17:18:10', NULL, NULL, 0),
(63, 7, 'depressed', 0, 'sad', 3, 'I’m really sorry you’re feeling this way.  It can help to talk about what’s weighing on you or to reach out to someone you trust.', 'Keep journaling to track your emotions!', 0, '2025-12-10 17:50:42', '2025-12-10 17:50:42', NULL, NULL, 0),
(64, 7, 'I WANNA END MYSELF', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-10 19:27:20', '2025-12-10 19:27:20', NULL, NULL, 0),
(65, 7, 'KILL', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-10 19:27:35', '2025-12-10 19:27:35', NULL, NULL, 0),
(66, 7, 'KILL', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-10 19:32:03', '2025-12-10 19:32:03', NULL, NULL, 0),
(67, 7, 'DEPRESSED', 0, 'depressed', 9, 'I’m really sorry you’re feeling this way.  It can be overwhelming when everything feels heavy, but you don’t have to face it alone.', 'Keep journaling to track your emotions!', 0, '2025-12-10 19:32:17', '2025-12-10 19:32:17', NULL, NULL, 0),
(68, 7, 'ANGRY', 0, 'neutral', 5, '{\"mood\":\"angry\",\"moodScore\":9,\"aiResponse\":\"I hear that you\'re feeling angry right now.  Anger can be overwhelming, but it\'s also a signal that something important is happening.', 'Keep journaling to track your emotions!', 0, '2025-12-10 19:45:34', '2025-12-10 19:45:34', NULL, NULL, 0),
(69, 7, 'ANRGY', 0, 'neutral', 5, '{\"mood\":\"angry\",\"moodScore\":9,\"aiResponse\":\"I can sense that you\'re feeling quite upset.  It’s okay to let that frustration out.', '{\"mood\":\"angry\",\"moodScore\":9,\"aiResponse\":\"I can sense that you\'re feeling quite upset. It’s okay to let that frustration out. If you’d like to talk about what’s bothering you or need help figuring something out, I’m here to listen and assist.\"}', 0, '2025-12-10 19:48:56', '2025-12-10 19:48:56', NULL, NULL, 0),
(70, 7, 'SVDSVS', 0, 'neutral', 5, '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"Keep journaling to track your emotions! \"}', '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"Keep journaling to track your emotions!\"}', 0, '2025-12-10 19:49:08', '2025-12-10 19:49:08', NULL, NULL, 0),
(71, 7, 'ANGRY', 0, 'neutral', 5, '{\"mood\":\"angry\",\"moodScore\":9,\"aiResponse\":\"I hear that you\'re feeling really upset right now.  It can be tough to deal with anger, but I\'m here to listen and help you work through it.', '{\"mood\":\"angry\",\"moodScore\":9,\"aiResponse\":\"I hear that you\'re feeling really upset right now. It can be tough to deal with anger, but I\'m here to listen and help you work through it. Let me know what\'s on your mind or if there\'s something specific that\'s triggering these feelings.\"}', 0, '2025-12-10 19:49:39', '2025-12-10 19:49:39', NULL, NULL, 0),
(72, 7, 'SAD', 0, 'neutral', 5, '{\"mood\":\"sad\",\"moodScore\":8,\"aiResponse\":\"I’m really sorry you’re feeling this way. It can help to talk about what’s on your mind or to find small steps that might bring a bit of relief. If you’d like, I’m here to listen or offer suggestions for coping strategies. You don’t have to face this alone.\"}', '{\"mood\":\"sad\",\"moodScore\":8,\"aiResponse\":\"I’m really sorry you’re feeling this way. It can help to talk about what’s on your mind or to find small steps that might bring a bit of relief. If you’d like, I’m here to listen or offer suggestions for coping strategies. You don’t have to face this alone.\"}', 0, '2025-12-10 19:53:47', '2025-12-10 19:53:47', NULL, NULL, 0),
(73, 7, 'EFGEGF', 0, 'neutral', 5, '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"It looks like your message might have been a typo or placeholder. How can I help you today?\"}', '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"It looks like your message might have been a typo or placeholder. How can I help you today?\"}', 0, '2025-12-10 19:53:52', '2025-12-10 19:53:52', NULL, NULL, 0),
(74, 7, 'ANRGY', 0, 'neutral', 5, '{\"mood\":\"angry\",\"moodScore\":9,\"aiResponse\":\"I hear you\'re feeling quite upset right now. It\'s okay to feel angry—sometimes it helps to talk through what\'s bothering you or take a short break to cool down. If you\'d like to share more about what\'s triggering this anger, I\'m here to listen and help you work through it.\"}', '{\"mood\":\"angry\",\"moodScore\":9,\"aiResponse\":\"I hear you\'re feeling quite upset right now. It\'s okay to feel angry—sometimes it helps to talk through what\'s bothering you or take a short break to cool down. If you\'d like to share more about what\'s triggering this anger, I\'m here to listen and help you work through it.\"}', 0, '2025-12-10 20:02:01', '2025-12-10 20:02:01', NULL, NULL, 0),
(75, 7, 'ANRGY', 0, 'neutral', 5, '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"Keep journaling to track your emotions!\"}', '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"Keep journaling to track your emotions!\"}', 0, '2025-12-10 20:07:32', '2025-12-10 20:07:32', NULL, NULL, 0),
(76, 7, 'SAD', 0, 'neutral', 5, '{\"mood\":\"sad\",\"moodScore\":8,\"aiResponse\":\"I’m really sorry you’re feeling this way. It can help to talk about what’s on your mind or just let it out. If you want, I’m here to listen or offer some gentle suggestions to lift your spirits.\"}', '{\"mood\":\"sad\",\"moodScore\":8,\"aiResponse\":\"I’m really sorry you’re feeling this way. It can help to talk about what’s on your mind or just let it out. If you want, I’m here to listen or offer some gentle suggestions to lift your spirits.\"}', 0, '2025-12-10 20:11:14', '2025-12-10 20:11:14', NULL, NULL, 0),
(77, 7, 'SFDFG', 0, 'neutral', 5, '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"I’m not quite sure what you mean by \\\"SFDFG\\\". Could you give me a bit more context or clarify what you’d like to discuss?\"}', '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"I’m not quite sure what you mean by \\\"SFDFG\\\". Could you give me a bit more context or clarify what you’d like to discuss?\"}', 0, '2025-12-10 20:11:26', '2025-12-10 20:11:26', NULL, NULL, 0),
(78, 7, 'SAD', 0, 'neutral', 5, '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"Keep journaling to track your emotions!\"}', '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"Keep journaling to track your emotions!\"}', 0, '2025-12-10 20:12:45', '2025-12-10 20:12:45', NULL, NULL, 0),
(79, 7, 'SAD', 0, 'neutral', 5, '[object Object]', '[object Object]', 0, '2025-12-10 20:22:08', '2025-12-10 20:22:08', NULL, NULL, 0),
(80, 7, 'ANGRY', 0, 'angry', 9, 'I can sense that you’re feeling upset right now.  It might help to take a deep breath or let me know what’s bothering you.', 'Keep journaling to track your emotions!', 0, '2025-12-10 20:22:46', '2025-12-10 20:22:46', NULL, NULL, 0),
(81, 7, 'SAD', 0, 'sad', 8, 'I\'m really sorry to hear that you\'re feeling sad.  It can help to talk about what\'s on your mind or simply let yourself feel the emotions without judgment.', 'Keep journaling to track your emotions!', 0, '2025-12-10 20:22:54', '2025-12-10 20:22:54', NULL, NULL, 0),
(82, 7, 'SAD', 0, 'neutral', 5, '{\"mood\":\"sad\",\"moodScore\":8,\"aiResponse\":\"I’m really sorry you’re feeling this way.  It can help to talk about what’s weighing on you or just vent out.', 'Keep journaling to track your emotions!', 0, '2025-12-10 20:23:28', '2025-12-10 20:23:28', NULL, NULL, 0),
(83, 7, 'AD', 0, 'neutral', 5, '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"Keep journaling to track your emotions! \"}', '{\"mood\":\"neutral\",\"moodScore\":5,\"aiResponse\":\"Keep journaling to track your emotions!\"}', 0, '2025-12-10 20:23:37', '2025-12-10 20:23:37', NULL, NULL, 0),
(84, 7, 'SAD', 0, 'neutral', 5, '{\"mood\":\"sad\",\"moodScore\":8,\"aiResponse\":\"I’m sorry you’re feeling this way. It can be tough when everything feels heavy. If you’d like to talk about what’s on your mind or need a distraction, I’m here to listen and help however I can.\"}', '{\"mood\":\"sad\",\"moodScore\":8,\"aiResponse\":\"I’m sorry you’re feeling this way. It can be tough when everything feels heavy. If you’d like to talk about what’s on your mind or need a distraction, I’m here to listen and help however I can.\"}', 0, '2025-12-10 20:23:45', '2025-12-10 20:23:45', NULL, NULL, 0),
(85, 7, 'Q', 0, 'neutral', 5, '[object Object]', '[object Object]', 0, '2025-12-10 20:23:55', '2025-12-10 20:23:55', NULL, NULL, 0),
(86, 7, 'SAD', 0, 'neutral', 5, '[object Object]', '[object Object]', 0, '2025-12-10 20:24:08', '2025-12-10 20:24:08', NULL, NULL, 0),
(87, 7, 'WFF', 0, 'neutral', 5, '[object Object]', '[object Object]', 0, '2025-12-10 20:27:12', '2025-12-10 20:27:12', NULL, NULL, 0),
(88, 7, 'ADSSADFSWFDWFWF SWD F', 0, 'neutral', 5, '[object Object]', '[object Object]', 0, '2025-12-10 20:27:25', '2025-12-10 20:27:25', NULL, NULL, 0),
(89, 7, 'ASFF', 0, 'neutral', 5, '[object Object]', '[object Object]', 0, '2025-12-10 20:29:45', '2025-12-10 20:29:45', NULL, NULL, 0),
(90, 7, 'ASFSAWFWSF WFW', 0, 'neutral', 5, '[object Object]', '[object Object]', 0, '2025-12-10 20:29:53', '2025-12-10 20:29:53', NULL, NULL, 0),
(91, 7, 'SAD', 0, 'neutral', 5, NULL, NULL, 0, '2025-12-10 20:53:33', '2025-12-10 20:53:33', NULL, NULL, 0),
(92, 7, 'DSSD', 0, 'neutral', 5, NULL, NULL, 0, '2025-12-10 20:53:41', '2025-12-10 20:53:41', NULL, NULL, 0),
(93, 7, 'FDEGDEGERGER YERY Y', 0, 'neutral', 5, NULL, NULL, 0, '2025-12-10 20:53:45', '2025-12-10 20:53:45', NULL, NULL, 0),
(94, 7, 'yawaaaaaaaaaaa', 0, 'neutral', 5, NULL, NULL, 0, '2025-12-10 21:01:30', '2025-12-10 21:01:30', NULL, NULL, 0),
(95, 7, 'asdfsadf saq', 0, 'neutral', 5, 'I’m not sure I understand what you’re trying to say.  Could you please clarify or let me know how I can help?', 'Keep journaling to track your emotions!', 0, '2025-12-11 05:39:57', '2025-12-11 05:39:57', NULL, NULL, 0),
(96, 7, 'sad', 0, 'neutral', 5, 'Keep journaling to track your emotions!', 'Keep journaling to track your emotions!', 0, '2025-12-11 05:40:03', '2025-12-11 05:40:03', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `username` varchar(50) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `role` enum('user','therapist','admin') NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `license_number` varchar(20) DEFAULT NULL,
  `license_date` date DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `created_at`, `username`, `full_name`, `updated_at`, `role`, `is_active`, `license_number`, `license_date`, `avatar`) VALUES
(6, 'deluteearllawrence@gmail.com', '$2b$12$BhPUUE8f4i0T8ZKMCbQLBOSYi0aLE8LQw0aj0TCwjb9w9Pf1X20Oy', '2025-12-10 13:48:45', 'System Admin', 'Earl Lawrence Delute', '2025-12-10 13:48:45', 'admin', 1, NULL, NULL, NULL),
(7, 'markdavejorda@gmail.com', '$2b$10$B9RESeJB239d7covlGntG.2KNDWGK5sKHp.0oTIZ7w1ORCqSRqsB2', '2025-12-10 14:54:22', 'markdave', NULL, '2025-12-10 14:54:22', 'user', 1, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `community_comments`
--
ALTER TABLE `community_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `post_id` (`post_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `community_likes`
--
ALTER TABLE `community_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_post` (`user_id`,`post_id`),
  ADD KEY `post_id` (`post_id`);

--
-- Indexes for table `community_posts`
--
ALTER TABLE `community_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `community_votes`
--
ALTER TABLE `community_votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_vote` (`post_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `harmful_word_log`
--
ALTER TABLE `harmful_word_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_entry_id` (`journal_entry_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `journals`
--
ALTER TABLE `journals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_mood` (`mood`);

--
-- Indexes for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assigned_therapist_id` (`assigned_therapist_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `community_comments`
--
ALTER TABLE `community_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `community_likes`
--
ALTER TABLE `community_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `community_posts`
--
ALTER TABLE `community_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `community_votes`
--
ALTER TABLE `community_votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `feedbacks`
--
ALTER TABLE `feedbacks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `harmful_word_log`
--
ALTER TABLE `harmful_word_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `journals`
--
ALTER TABLE `journals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `journal_entries`
--
ALTER TABLE `journal_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `community_comments`
--
ALTER TABLE `community_comments`
  ADD CONSTRAINT `community_comments_ibfk_251` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `community_comments_ibfk_252` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `community_likes`
--
ALTER TABLE `community_likes`
  ADD CONSTRAINT `community_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `community_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `community_posts`
--
ALTER TABLE `community_posts`
  ADD CONSTRAINT `community_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `community_votes`
--
ALTER TABLE `community_votes`
  ADD CONSTRAINT `community_votes_ibfk_231` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `community_votes_ibfk_232` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `harmful_word_log`
--
ALTER TABLE `harmful_word_log`
  ADD CONSTRAINT `harmful_word_log_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `harmful_word_log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `journals`
--
ALTER TABLE `journals`
  ADD CONSTRAINT `journals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD CONSTRAINT `journal_entries_ibfk_1` FOREIGN KEY (`assigned_therapist_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
