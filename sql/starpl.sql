-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Erstellungszeit: 06. Dez 2017 um 16:45
-- Server-Version: 10.0.31-MariaDB-0ubuntu0.16.04.2
-- PHP-Version: 7.0.22-0ubuntu0.16.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `starpl`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `files`
--

CREATE TABLE `files` (
  `Id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `titel` text NOT NULL,
  `student` text NOT NULL,
  `studiengang` text NOT NULL,
  `language` text NOT NULL,
  `artOfArbeit` text NOT NULL,
  `jahrgang` int(4) NOT NULL,
  `betreuer` text NOT NULL,
  `firma` text NOT NULL,
  `sperrvermerk` tinyint(1) NOT NULL,
  `kurzfassung` text NOT NULL,
  `downloads` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `SearchWords`
--

CREATE TABLE `SearchWords` (
  `FileId` int(11) NOT NULL,
  `Word` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `userLogin`
--

CREATE TABLE `userLogin` (
  `Id` int(11) NOT NULL,
  `UserName` text NOT NULL,
  `UserRole` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `studentAccounts`(
  `Id` int(11) NOT NULL,
  `UserId` int(11) NOT NULL,
  `DozentId` int(11) NOT NULL,
  `ExpiryDate` DATETIME NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Daten für Tabelle `userLogin`
--

INSERT INTO `userLogin` (`Id`, `UserName`, `UserRole`) VALUES
(1, 's_brandenburg', 1),
(2, 'admin', 1);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`Id`);

--
-- Indizes für die Tabelle `SearchWords`
--
ALTER TABLE `SearchWords`
  ADD UNIQUE KEY `FileId` (`FileId`,`Word`(20));

--
-- Indizes für die Tabelle `userLogin`
--
ALTER TABLE `userLogin`
  ADD PRIMARY KEY (`Id`),
  ADD UNIQUE KEY `UserName` (`UserName`(20));


ALTER TABLE `studentAccounts`
    ADD PRIMARY KEY (`Id`);
--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `files`
--
ALTER TABLE `files`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `userLogin`
--
ALTER TABLE `userLogin`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `studentAccounts`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
