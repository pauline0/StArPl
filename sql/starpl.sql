-- phpMyAdmin SQL Dump
-- version 4.6.6deb4
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Erstellungszeit: 22. Sep 2017 um 11:22
-- Server-Version: 10.1.25-MariaDB-
-- PHP-Version: 7.0.22-0ubuntu0.17.04.1

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
  `kurzfassung` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `login`
--

CREATE TABLE `login` (
  `Id` int(11) NOT NULL,
  `UserName` text NOT NULL,
  `Password` text NOT NULL,
  `UserRole` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Daten für Tabelle `login`
--

INSERT INTO `login` (`Id`, `UserName`, `Password`, `UserRole`) VALUES
(1, 'admin', '21232f297a57a5a743894a0e4a801fc3', 1),
(2, 'leo7044', '3684c2c69316c14e9564c303439e564e', 0);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `SearchWords`
--

CREATE TABLE `SearchWords` (
  `FileId` int(11) NOT NULL,
  `Word` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`Id`);

--
-- Indizes für die Tabelle `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`Id`),
  ADD UNIQUE KEY `UserName` (`UserName`(20));

--
-- Indizes für die Tabelle `SearchWords`
--
ALTER TABLE `SearchWords`
  ADD UNIQUE KEY `FileId` (`FileId`,`Word`(20));

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `files`
--
ALTER TABLE `files`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `login`
--
ALTER TABLE `login`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
