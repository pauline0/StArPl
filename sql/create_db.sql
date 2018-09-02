
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `starpl_2`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `files`
--



DROP DATABASE IF EXISTS starpl2;

CREATE DATABASE starpl2;

# ------ Grant Access

GRANT ALL ON starpl2.* TO starpl@'localhost';

USE starpl2;

CREATE TABLE `files` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` text NOT NULL,
  `student` text NOT NULL,
  `fb` tinyint(2) NOT NULL,
  `language` tinyint(2) NOT NULL,
  `type` tinyint(2) NOT NULL,
  `year` int(4) NOT NULL,
  `docent` text NOT NULL,
  `company` text NOT NULL,
  `restricted` tinyint(1) NOT NULL,
  `abstract` text NOT NULL,
  `private` tinyint(1) NOT NULL,
  `downloads` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `search_words`
--

CREATE TABLE `search_words` (
  `file_id` int(11) NOT NULL,
  `word` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------


CREATE TABLE `user_login` (
  `id` int(11) NOT NULL,
  `user_name` text NOT NULL,
  `user_role` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `student_accounts`(
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `docent_id` int(11) NOT NULL,
  `expiry_date` DATETIME NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `release_requests`(
  `id` int(11) NOT NULL,
  `student_account_id` int(11) NOT NULL,
  `file_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO `user_login` (`id`, `user_name`, `user_role`) VALUES
(1, 's_brandenburg', 1),
(2, 'admin', 1);

--
-- Indizes der exportierten Tabellen
--


ALTER TABLE `files`
  ADD PRIMARY KEY (`id`);


ALTER TABLE `search_words`
  ADD UNIQUE KEY `file_id` (`file_id`,`word`(20));


ALTER TABLE `user_login`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_name` (`user_name`(20));


ALTER TABLE `student_accounts`
    ADD PRIMARY KEY (`id`);

ALTER TABLE `release_requests`
    ADD PRIMARY KEY (`id`);
--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `files`
--
ALTER TABLE `files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `userLogin`
--
ALTER TABLE `user_login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `student_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `release_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `release_requests`
  ADD CONSTRAINT fk_student_acc_id FOREIGN KEY (`student_account_id`) REFERENCES `student_accounts`(`id`) ON DELETE CASCADE;
ALTER TABLE `release_requests`
  ADD CONSTRAINT fk_files_id FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE;


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
