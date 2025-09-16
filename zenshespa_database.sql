-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:4306
-- Généré le : mar. 16 sep. 2025 à 09:39
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `zenshespa_database`
--

-- --------------------------------------------------------

--
-- Structure de la table `avis_clients`
--

CREATE TABLE `avis_clients` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `note` decimal(2,1) NOT NULL CHECK (`note` >= 1 and `note` <= 5),
  `commentaire` text DEFAULT NULL,
  `date_avis` timestamp NOT NULL DEFAULT current_timestamp(),
  `visible` tinyint(1) DEFAULT 1,
  `reponse_admin` text DEFAULT NULL,
  `date_reponse` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `avis_clients`
--

INSERT INTO `avis_clients` (`id`, `client_id`, `note`, `commentaire`, `date_avis`, `visible`, `reponse_admin`, `date_reponse`, `created_at`, `updated_at`) VALUES
(1, 1, 5.0, 'Service excellent, très professionnel!', '2025-08-13 09:59:19', 1, NULL, NULL, '2025-08-13 09:59:19', '2025-08-13 09:59:19'),
(2, 2, 4.5, 'Très satisfaite du résultat, je recommande!', '2025-08-13 09:59:19', 1, NULL, NULL, '2025-08-13 09:59:19', '2025-08-13 09:59:19');

-- --------------------------------------------------------

--
-- Structure de la table `categories_services`
--

CREATE TABLE `categories_services` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `couleur_theme` varchar(7) DEFAULT '#2e4d4c',
  `ordre_affichage` int(11) DEFAULT 0,
  `actif` tinyint(1) DEFAULT 1,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `categories_services`
--

INSERT INTO `categories_services` (`id`, `nom`, `description`, `couleur_theme`, `ordre_affichage`, `actif`, `date_creation`) VALUES
(1, 'V-Steam', 'Bain de vapeur vaginal aux herbes avec consultation pré et post-session plus boisson gratuite', '#2e4d4c', 1, 1, '2025-07-17 13:10:31'),
(2, 'Vajacials', 'Protocole de soins intimes en trois étapes avec consultation santé de 5 minutes', '#4a6b69', 2, 1, '2025-07-17 13:10:31'),
(3, 'Massages', 'Massages des pieds, du dos et des yeux avec machines spécialisées', '#5a7c7a', 3, 1, '2025-07-17 13:10:31'),
(4, 'Rituels ZenShe', 'Combinaisons de soins pour une expérience complète de bien-être', '#6d8d8b', 4, 1, '2025-07-17 13:10:31'),
(5, 'Spa Capillaire Japonais', 'Détox botanique du cuir chevelu avec produits La Biosthetique', '#7a9a98', 5, 1, '2025-07-17 13:10:31'),
(6, 'Épilation', 'Services d\'épilation professionnels', '#8aaba9', 6, 1, '2025-07-17 13:10:31');

-- --------------------------------------------------------

--
-- Structure de la table `categories_services_translations`
--

CREATE TABLE `categories_services_translations` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `language_code` varchar(5) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `categories_services_translations`
--

INSERT INTO `categories_services_translations` (`id`, `category_id`, `language_code`, `nom`, `description`, `date_creation`, `date_modification`) VALUES
(1, 1, 'fr', 'V-Steam', 'Bain de vapeur vaginal aux herbes avec consultation pré et post-session plus boisson gratuite', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(2, 2, 'fr', 'Vajacials', 'Protocole de soins intimes en trois étapes avec consultation santé de 5 minutes', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(3, 3, 'fr', 'Massages', 'Massages des pieds, du dos et des yeux avec machines spécialisées', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(4, 4, 'fr', 'Rituels ZenShe', 'Combinaisons de soins pour une expérience complète de bien-être', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(5, 5, 'fr', 'Spa Capillaire Japonais', 'Détox botanique du cuir chevelu avec produits La Biosthetique', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(6, 6, 'fr', 'Épilation', 'Services d\'épilation professionnels', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(8, 1, 'en', 'V-Steam', 'Vaginal herbal steaming with pre and post-session consultation plus complimentary drink', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(9, 2, 'en', 'Vajacials', 'Three-step intimate care protocol with 5-minute health consultation', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(10, 3, 'en', 'Massages', 'Foot, back and eye massages with specialized machines', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(11, 4, 'en', 'ZenShe Rituals', 'Care combinations for a complete wellness experience', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(12, 5, 'en', 'Japanese Hair Spa', 'Botanical scalp detox with La Biosthetique products', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(13, 6, 'en', 'Hair Removal', 'Professional hair removal services', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(14, 1, 'ar', 'V-Steam', 'حمام البخار المهبلي بالأعشاب مع استشارة قبل وبعد الجلسة بالإضافة إلى مشروب مجاني', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(15, 2, 'ar', 'Vajacials', 'بروتوكول العناية الحميمة من ثلاث خطوات مع استشارة صحية لمدة 5 دقائق', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(16, 3, 'ar', 'تدليك', 'تدليك القدمين والظهر والعينين بأجهزة متخصصة', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(17, 4, 'ar', 'طقوس زين شي', 'مجموعات العناية لتجربة عافية كاملة', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(18, 5, 'ar', 'سبا الشعر الياباني', 'إزالة السموم النباتية من فروة الرأس بمنتجات La Biosthetique', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(19, 6, 'ar', 'إزالة الشعر', 'خدمات إزالة الشعر المهنية', '2025-08-04 13:16:48', '2025-08-04 13:16:48');

-- --------------------------------------------------------

--
-- Structure de la table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL COMMENT 'Bcrypt hashed password for client authentication',
  `email_verifie` tinyint(1) DEFAULT 0 COMMENT 'Email verification status',
  `langue_preferee` varchar(5) DEFAULT 'fr' COMMENT 'Client preferred language (fr, en, ar)',
  `statut` enum('actif','inactif') DEFAULT 'actif' COMMENT 'Simplified client account status',
  `telephone` varchar(20) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `referred_by_code_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Simplified client table - removed unused security features';

--
-- Déchargement des données de la table `clients`
--

INSERT INTO `clients` (`id`, `prenom`, `nom`, `email`, `mot_de_passe`, `email_verifie`, `langue_preferee`, `statut`, `telephone`, `date_naissance`, `adresse`, `notes`, `actif`, `date_creation`, `date_modification`, `referred_by_code_id`) VALUES
(1, 'Marie', 'Dupont', 'marie.dupont@email.com', NULL, 1, 'fr', 'actif', '514-555-0123', NULL, NULL, NULL, 1, '2025-07-17 13:10:32', '2025-08-04 13:16:32', NULL),
(2, 'Yassine', 'FRIGUI', 'friguiyassine750@gmail.com', NULL, 1, 'fr', 'actif', '111111111111', NULL, NULL, NULL, 1, '2025-07-17 19:31:32', '2025-08-13 21:52:31', NULL),
(3, 'User', 'Test', 'test@example.com', '$2a$12$OxMRvS0TtDBXo4orwxeLwe2nJjp1bpI3FbCcGNzh8IgjbULXUJYQ2', 0, 'fr', 'actif', '12345678', NULL, NULL, NULL, 1, '2025-08-13 11:40:58', '2025-08-13 21:21:07', NULL),
(4, 'User2', 'Test2', 'test2@example.com', '$2a$12$caV6dfVcBNyCmTl4u55pRuIaMTQUKkPO/DQel4j4eoG27fJOhvk1m', 0, 'fr', 'actif', '1234567890', NULL, NULL, NULL, 1, '2025-08-13 11:42:56', '2025-08-13 11:42:56', NULL),
(5, 'Yassine', 'test', 'testfinal@example.com', '$2a$12$5Y.q3PdcgooixeL6K5GRlOKavxJNA0NjF25rFpu3rjbMiEp5tBBdm', 1, 'fr', 'actif', '111111111111', NULL, NULL, NULL, 1, '2025-08-13 11:48:58', '2025-08-15 16:30:58', NULL),
(6, 'Yassine', 'FRIGUI', 'riff3183@gmail.com', '$2a$12$jZQkXwT46JwSVV4yd4rsDeivFf79yQJ8O4vGayRq8IiUqShAm/emK', 1, 'fr', 'actif', '+21699999999', NULL, NULL, NULL, 1, '2025-08-13 18:10:54', '2025-08-13 18:10:54', NULL),
(10, 'User', 'Draft', 'draft@example.com', NULL, 0, 'fr', 'actif', '87654321', NULL, NULL, NULL, 1, '2025-08-13 21:22:02', '2025-08-13 21:22:02', NULL),
(11, 'Test', 'Email', 'yassinematoussi42@gmail.com', NULL, 0, 'fr', 'actif', '12345678', NULL, NULL, NULL, 1, '2025-08-13 21:31:25', '2025-08-13 21:31:25', NULL),
(12, 'test', 'test', 'yassinefrigui9@gmail.com', '$2a$12$LvD27O7YwzZFmeSzFiD9Du5c9JaqJUfGMQHbDtFqVim5XA9ou9fLa', 1, 'fr', 'actif', '87654321', NULL, NULL, NULL, 1, '2025-08-13 22:44:35', '2025-08-23 19:11:25', NULL),
(13, 'Yassine', 'test', 'test@gmail.com', NULL, 0, 'fr', 'actif', '22222222222222', NULL, NULL, NULL, 1, '2025-08-15 13:36:30', '2025-08-15 16:37:38', NULL),
(14, 'Sonia', 'Najjar', 'sonyta-n-uk@hotmail.fr', NULL, 0, 'fr', 'actif', '0021629361740', NULL, NULL, NULL, 1, '2025-08-15 15:56:26', '2025-08-15 15:56:26', NULL),
(15, 'testerr', 'testerr', 'testing123456@gmail.com', NULL, 0, 'fr', 'actif', '99999999', NULL, NULL, NULL, 1, '2025-08-15 16:02:21', '2025-08-15 16:02:21', NULL),
(16, 'test', 'test', '123@gmail.com', NULL, 0, 'fr', 'actif', '1111111111111', NULL, NULL, NULL, 1, '2025-08-15 16:03:29', '2025-08-15 16:03:29', NULL),
(17, 'Rourou', 'Ziadi', 'rahmaziadi25@gmail.com', NULL, 0, 'fr', 'actif', '52768613', NULL, NULL, NULL, 1, '2025-08-15 16:29:51', '2025-08-15 16:29:51', NULL),
(18, 'Sirine', 'Lamine', 'marcyline1234@yahoo.fr', NULL, 0, 'fr', 'actif', '56280958', NULL, NULL, NULL, 1, '2025-08-19 15:30:01', '2025-08-19 15:30:18', NULL),
(19, 'Test', 'Test', 'sonia.najjar@cgs.com.tn', NULL, 0, 'fr', 'actif', '12345678', NULL, NULL, NULL, 1, '2025-08-23 19:09:59', '2025-08-23 19:09:59', NULL),
(20, 'Client', 'Test', 'testclient1757852224243@example.com', '$2b$12$f395A.egvOCJV2vZ2D5dqOHQSw.qN/7haKM6ttGiuXUqUB6UDo.4e', 1, 'fr', 'actif', '+21612345678', NULL, NULL, NULL, 1, '2025-09-14 12:17:05', '2025-09-14 12:17:05', NULL);

--
-- Déclencheurs `clients`
--
DELIMITER $$
CREATE TRIGGER `update_client_modification_date` BEFORE UPDATE ON `clients` FOR EACH ROW BEGIN
    SET NEW.date_modification = NOW();
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `client_login_attempts`
--

CREATE TABLE `client_login_attempts` (
  `id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Login attempt tracking for security';

--
-- Déchargement des données de la table `client_login_attempts`
--

INSERT INTO `client_login_attempts` (`id`, `client_id`, `ip_address`, `success`, `attempted_at`, `user_agent`) VALUES
(1, 5, '::1', 1, '2025-08-13 11:49:12', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `client_sessions`
--

CREATE TABLE `client_sessions` (
  `id` varchar(128) NOT NULL COMMENT 'Session ID',
  `client_id` int(11) NOT NULL COMMENT 'Client ID',
  `data` text DEFAULT NULL COMMENT 'Session data in JSON format',
  `expires` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Session expiration timestamp',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Client IP address',
  `user_agent` text DEFAULT NULL COMMENT 'Client user agent string',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `token` varchar(512) DEFAULT NULL COMMENT 'JWT token',
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Alternative expiration field'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Client sessions for authentication';

--
-- Déchargement des données de la table `client_sessions`
--

INSERT INTO `client_sessions` (`id`, `client_id`, `data`, `expires`, `ip_address`, `user_agent`, `created_at`, `updated_at`, `token`, `expires_at`) VALUES
('a81cc0b1-629b-4c4c-a357-401dcb2a6af2', 5, NULL, '2025-08-13 11:49:12', '::1', 'curl/8.13.0', '2025-08-13 11:49:12', '2025-08-13 11:49:12', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6NSwidHlwZSI6ImNsaWVudCIsImlhdCI6MTc1NTA4NTc1MiwiZXhwIjoxNzU1NjkwNTUyfQ.b3ZMcTlRr3KZFLUiRUS9qM_EFeGbM3UwH4eGz60P26k', '2025-08-20 11:49:12');

-- --------------------------------------------------------

--
-- Structure de la table `client_verification_tokens`
--

CREATE TABLE `client_verification_tokens` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `type` enum('email','password_reset') NOT NULL DEFAULT 'email',
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Client verification tokens for email verification and password reset';

--
-- Déchargement des données de la table `client_verification_tokens`
--

INSERT INTO `client_verification_tokens` (`id`, `client_id`, `token`, `type`, `expires_at`, `used_at`, `created_at`) VALUES
(1, 3, '0c1f7ff97af7bf4f56b9c4ddf9fbccfac03019ba6b2ad0f097f32cbdf88f0ecd', 'email', '2025-08-14 11:40:58', NULL, '2025-08-13 11:40:58'),
(2, 4, 'dae556bef576530f4ca22247cc42fd7cee17c90f486f465464595a6140b6fbf1', 'email', '2025-08-14 11:42:56', NULL, '2025-08-13 11:42:56');

-- --------------------------------------------------------

--
-- Structure de la table `creneaux_horaires`
--

CREATE TABLE `creneaux_horaires` (
  `id` int(11) NOT NULL,
  `jour_semaine` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `creneaux_horaires`
--

INSERT INTO `creneaux_horaires` (`id`, `jour_semaine`, `heure_debut`, `heure_fin`, `actif`, `date_creation`) VALUES
(1, 'lundi', '09:00:00', '19:00:00', 1, '2025-07-17 13:10:32'),
(2, 'mardi', '09:00:00', '19:00:00', 1, '2025-07-17 13:10:32'),
(3, 'mercredi', '09:00:00', '19:00:00', 1, '2025-07-17 13:10:32'),
(4, 'jeudi', '09:00:00', '20:00:00', 1, '2025-07-17 13:10:32'),
(5, 'vendredi', '09:00:00', '20:00:00', 1, '2025-07-17 13:10:32'),
(6, 'samedi', '09:00:00', '18:00:00', 1, '2025-07-17 13:10:32');

-- --------------------------------------------------------

--
-- Structure de la table `fermetures_exceptionnelles`
--

CREATE TABLE `fermetures_exceptionnelles` (
  `id` int(11) NOT NULL,
  `date_fermeture` date NOT NULL,
  `raison` varchar(255) DEFAULT NULL,
  `toute_journee` tinyint(1) DEFAULT 1,
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `inventaire`
--

CREATE TABLE `inventaire` (
  `id` int(11) NOT NULL,
  `nom_produit` varchar(150) NOT NULL,
  `marque` varchar(100) DEFAULT NULL COMMENT 'Product brand',
  `type_produit` varchar(50) DEFAULT NULL COMMENT 'Product type/category',
  `couleur` varchar(50) DEFAULT NULL COMMENT 'Product color',
  `code_produit` varchar(50) DEFAULT NULL COMMENT 'Product code/SKU',
  `quantite_stock` int(11) DEFAULT 0,
  `quantite_minimum` int(11) DEFAULT 0,
  `prix_achat` decimal(10,2) DEFAULT NULL COMMENT 'Purchase price',
  `prix_vente` decimal(10,2) DEFAULT NULL COMMENT 'Selling price',
  `prix_unitaire` decimal(10,2) DEFAULT NULL,
  `fournisseur` varchar(100) DEFAULT NULL,
  `date_achat` date DEFAULT NULL COMMENT 'Purchase date',
  `date_expiration` date DEFAULT NULL,
  `emplacement` varchar(100) DEFAULT NULL COMMENT 'Storage location',
  `notes` text DEFAULT NULL COMMENT 'Additional notes',
  `actif` tinyint(1) DEFAULT 1,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `memberships`
--

CREATE TABLE `memberships` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prix_mensuel` decimal(10,2) NOT NULL,
  `prix_3_mois` decimal(10,2) DEFAULT NULL,
  `services_par_mois` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `avantages` text DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `memberships`
--

INSERT INTO `memberships` (`id`, `nom`, `prix_mensuel`, `prix_3_mois`, `services_par_mois`, `description`, `avantages`, `actif`, `date_creation`) VALUES
(1, 'SILVER', 210.00, NULL, 3, '3 services par mois', 'Choix parmi: V-Steam (10 min), Japanese Head Spa (45 min), Restorative Vajacial (65 min), Full-Body Machine Massage (15 min)', 1, '2025-07-17 13:10:32'),
(2, 'GOLD', 325.00, 280.00, 5, '5 services par mois', 'Choix étendu + 1 Free Full-Body Machine Massage (15 min) avec engagement 3 mois', 1, '2025-07-17 13:10:32'),
(3, 'PLATINUM', 480.00, 445.00, 8, '8 services par mois', 'Accès complet + choix 1 Free Restorative Vajacial (65 min) ou 1 Free 90 min Head Spa avec engagement 3 mois', 1, '2025-07-17 13:10:32'),
(4, 'VIP', 750.00, 660.00, 12, 'Jusqu\'à 12 visites par mois', 'Accès illimité + Free 90 min Deluxe Head Spa mensuel + 1 Free Restorative Vajacial mensuel + 3 Steam & Eye Massage upgrades + 15% réduction add-ons + réservation prioritaire + événements exclusifs', 1, '2025-07-17 13:10:32');

-- --------------------------------------------------------

--
-- Structure de la table `memberships_translations`
--

CREATE TABLE `memberships_translations` (
  `id` int(11) NOT NULL,
  `membership_id` int(11) NOT NULL,
  `language_code` varchar(5) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `avantages` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `memberships_translations`
--

INSERT INTO `memberships_translations` (`id`, `membership_id`, `language_code`, `nom`, `description`, `avantages`, `date_creation`, `date_modification`) VALUES
(1, 1, 'fr', 'SILVER', '3 services par mois', 'Choix parmi: V-Steam (10 min), Japanese Head Spa (45 min), Restorative Vajacial (65 min), Full-Body Machine Massage (15 min)', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(2, 2, 'fr', 'GOLD', '5 services par mois', 'Choix étendu + 1 Free Full-Body Machine Massage (15 min) avec engagement 3 mois', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(3, 3, 'fr', 'PLATINUM', '8 services par mois', 'Accès complet + choix 1 Free Restorative Vajacial (65 min) ou 1 Free 90 min Head Spa avec engagement 3 mois', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(4, 4, 'fr', 'VIP', 'Jusqu\'à 12 visites par mois', 'Accès illimité + Free 90 min Deluxe Head Spa mensuel + 1 Free Restorative Vajacial mensuel + 3 Steam & Eye Massage upgrades + 15% réduction add-ons + réservation prioritaire + événements exclusifs', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(8, 1, 'en', 'SILVER', '3 services per month', 'Choose from: V-Steam (10 min), Japanese Head Spa (45 min), Restorative Vajacial (65 min), Full-Body Machine Massage (15 min)', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(9, 2, 'en', 'GOLD', '5 services per month', 'Extended choice + 1 Free Full-Body Machine Massage (15 min) with 3-month commitment', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(10, 3, 'en', 'PLATINUM', '8 services per month', 'Full access + choice of 1 Free Restorative Vajacial (65 min) or 1 Free 90 min Head Spa with 3-month commitment', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(11, 4, 'en', 'VIP', 'Up to 12 visits per month', 'Unlimited access + Free 90 min Deluxe Head Spa monthly + 1 Free Restorative Vajacial monthly + 3 Steam & Eye Massage upgrades + 15% discount on add-ons + priority booking + exclusive events', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(12, 1, 'ar', 'فضي', '3 خدمات شهرياً', 'اختر من: V-Steam (10 دقائق)، سبا الرأس الياباني (45 دقيقة)، Vajacial الترميمي (65 دقيقة)، تدليك الجسم بالكامل بالآلة (15 دقيقة)', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(13, 2, 'ar', 'ذهبي', '5 خدمات شهرياً', 'خيار موسع + 1 تدليك جسم كامل مجاني بالآلة (15 دقيقة) مع التزام 3 أشهر', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(14, 3, 'ar', 'بلاتيني', '8 خدمات شهرياً', 'وصول كامل + اختيار 1 Vajacial ترميمي مجاني (65 دقيقة) أو 1 سبا رأس مجاني 90 دقيقة مع التزام 3 أشهر', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(15, 4, 'ar', 'VIP', 'حتى 12 زيارة شهرياً', 'وصول غير محدود + سبا رأس فاخر مجاني 90 دقيقة شهرياً + 1 Vajacial ترميمي مجاني شهرياً + 3 ترقيات تدليك البخار والعين + خصم 15% على الإضافات + حجز أولوية + أحداث حصرية', '2025-08-04 13:16:48', '2025-08-04 13:16:48');

-- --------------------------------------------------------

--
-- Structure de la table `parametres_salon`
--

CREATE TABLE `parametres_salon` (
  `id` int(11) NOT NULL,
  `nom_salon` varchar(150) DEFAULT 'ZenShe Spa',
  `adresse` text DEFAULT '9777 Yonge Street, Richmond Hill, ON L4C 1T9, Canada',
  `telephone` varchar(20) DEFAULT '905-605-1188',
  `email` varchar(255) DEFAULT 'info@zenshe.ca',
  `site_web` varchar(255) DEFAULT 'https://zenshe.ca',
  `horaires_ouverture` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '{"lundi":"9h-19h","mardi":"9h-19h","mercredi":"9h-19h","jeudi":"9h-20h","vendredi":"9h-20h","samedi":"9h-18h","dimanche":"Fermé"}' CHECK (json_valid(`horaires_ouverture`)),
  `couleur_principale` varchar(7) DEFAULT '#2e4d4c',
  `couleur_secondaire` varchar(7) DEFAULT '#4a6b69',
  `logo_url` varchar(500) DEFAULT '/images/zenshe_logo.png',
  `message_accueil` text DEFAULT 'Bienvenue chez ZenShe Spa, votre destination pour le bien-être intime et la guérison holistique.',
  `politique_annulation` text DEFAULT 'Annulation gratuite jusqu\'à 24h avant le rendez-vous.',
  `cgv` text DEFAULT NULL,
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `parametres_salon`
--

INSERT INTO `parametres_salon` (`id`, `nom_salon`, `adresse`, `telephone`, `email`, `site_web`, `horaires_ouverture`, `couleur_principale`, `couleur_secondaire`, `logo_url`, `message_accueil`, `politique_annulation`, `cgv`, `date_modification`) VALUES
(1, 'ZenShe Spa', '9777 Yonge Street, Richmond Hill, ON L4C 1T9, Canada', '905-605-1188', 'info@zenshe.ca', 'https://zenshe.ca', '{\"lundi\":\"9h-19h\",\"mardi\":\"9h-19h\",\"mercredi\":\"9h-19h\",\"jeudi\":\"9h-20h\",\"vendredi\":\"9h-20h\",\"samedi\":\"9h-18h\",\"dimanche\":\"Fermé\"}', '#2e4d4c', '#4a6b69', '/images/zenshe_logo.png', 'Bienvenue chez ZenShe Spa, votre destination pour le bien-être intime et la guérison holistique.', 'Annulation gratuite jusqu\'à 24h avant le rendez-vous.', NULL, '2025-07-17 13:10:32');

-- --------------------------------------------------------

--
-- Structure de la table `parametres_salon_translations`
--

CREATE TABLE `parametres_salon_translations` (
  `id` int(11) NOT NULL,
  `parametre_id` int(11) NOT NULL,
  `language_code` varchar(5) NOT NULL,
  `nom_salon` varchar(150) DEFAULT NULL,
  `message_accueil` text DEFAULT NULL,
  `politique_annulation` text DEFAULT NULL,
  `cgv` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `parametres_salon_translations`
--

INSERT INTO `parametres_salon_translations` (`id`, `parametre_id`, `language_code`, `nom_salon`, `message_accueil`, `politique_annulation`, `cgv`, `date_creation`, `date_modification`) VALUES
(1, 1, 'fr', 'ZenShe Spa', 'Bienvenue chez ZenShe Spa, votre destination pour le bien-être intime et la guérison holistique.', 'Annulation gratuite jusqu\'à 24h avant le rendez-vous.', NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(2, 1, 'en', 'ZenShe Spa', 'Welcome to ZenShe Spa, your destination for intimate wellness and holistic healing.', 'Free cancellation up to 24 hours before appointment.', NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(3, 1, 'ar', 'سبا زين شي', 'مرحباً بكم في سبا زين شي، وجهتكم للعافية الحميمة والشفاء الشامل.', 'إلغاء مجاني حتى 24 ساعة قبل الموعد.', NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48');

-- --------------------------------------------------------

--
-- Structure de la table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `verification_code` varchar(6) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `client_id`, `token_hash`, `verification_code`, `expires_at`, `used_at`, `created_at`) VALUES
(1, 5, 'dda566f0c43fc4f1136462bf76e78dbb93c4f7528288539e3a2c9ebb8a28e10f', NULL, '2025-08-13 18:43:49', NULL, '2025-08-13 17:13:49'),
(2, 6, '32814cd8bf164987a179883f83fb9b10d00c458a63e96d27d5faed7e716ddf0d', NULL, '2025-08-13 19:41:33', NULL, '2025-08-13 18:11:33'),
(3, 6, '485fdc700c576be4cdbd8ee6db915f8cac5d34d6f95f0c4c29ccf08c5a91798b', NULL, '2025-08-13 20:00:41', NULL, '2025-08-13 18:30:41'),
(4, 6, '74e1233a06eff49b19a8b051b541bb081af5f097164a57fc09b8e1ada5d3941e', NULL, '2025-08-13 20:03:52', NULL, '2025-08-13 18:33:52'),
(5, 6, 'daaec4a9cf6c7e5e2ef8cb62f3e5eaf0a46f962c7f4eba815260fa6f211c7192', NULL, '2025-08-13 20:16:23', NULL, '2025-08-13 18:46:23'),
(6, 6, '6f0b735796e739c752b43b4654c392003151078ba8fc467e65d253a46060ac6c', NULL, '2025-08-13 20:16:56', NULL, '2025-08-13 18:46:56'),
(7, 6, 'cf44769076d90e4694abf28a330679c5259d92172bab5cbf04d0c61c40ffa758', NULL, '2025-08-13 20:18:49', NULL, '2025-08-13 18:48:49'),
(8, 6, '978bfbeddb3606890af4a43c23435bedab81d4d4fec3d46b85bbc5c6c1b6b104', NULL, '2025-08-13 20:25:33', NULL, '2025-08-13 18:55:33');

-- --------------------------------------------------------

--
-- Structure de la table `promotions`
--

CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `type_reduction` enum('pourcentage','montant_fixe') NOT NULL,
  `valeur_reduction` decimal(10,2) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `code_promo` varchar(50) DEFAULT NULL,
  `montant_minimum` decimal(10,2) DEFAULT 0.00,
  `service_id` int(11) DEFAULT NULL,
  `categorie_id` int(11) DEFAULT NULL,
  `nombre_utilisations_max` int(11) DEFAULT NULL,
  `nombre_utilisations_actuelles` int(11) DEFAULT 0,
  `actif` tinyint(1) DEFAULT 1,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `referral_codes`
--

CREATE TABLE `referral_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `owner_client_id` int(11) NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT 10.00,
  `max_uses` int(11) DEFAULT NULL,
  `current_uses` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `referral_codes`
--

INSERT INTO `referral_codes` (`id`, `code`, `owner_client_id`, `discount_percentage`, `max_uses`, `current_uses`, `is_active`, `created_at`, `expires_at`) VALUES
(1, 'OUJXL44T', 1, 15.00, 5, 0, 1, '2025-09-14 12:14:08', NULL),
(2, 'TOD5SPLH', 1, 15.00, 5, 0, 1, '2025-09-14 12:14:52', NULL),
(3, 'PTIE3WXG', 1, 15.00, 5, 0, 1, '2025-09-14 12:17:04', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `referral_usage`
--

CREATE TABLE `referral_usage` (
  `id` int(11) NOT NULL,
  `referral_code_id` int(11) NOT NULL,
  `used_by_client_id` int(11) NOT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `service_id` int(11) NOT NULL,
  `date_reservation` date NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `statut` enum('en_attente','confirmee','en_cours','terminee','annulee','no_show','draft') DEFAULT 'en_attente' COMMENT 'Business-facing status: what the admin/client sees. Used for UI, filtering, and business logic.',
  `reservation_status` enum('draft','reserved','confirmed','cancelled') DEFAULT 'draft' COMMENT 'Technical/flow status: used for internal logic, draft conversion, and backend processes.',
  `prix_service` decimal(10,2) NOT NULL DEFAULT 0.00,
  `prix_final` decimal(10,2) NOT NULL DEFAULT 0.00,
  `client_nom` varchar(100) DEFAULT NULL,
  `client_prenom` varchar(100) DEFAULT NULL,
  `client_telephone` varchar(20) DEFAULT NULL,
  `client_email` varchar(255) DEFAULT NULL,
  `notes_client` text DEFAULT NULL,
  `verification_code` varchar(6) DEFAULT NULL,
  `verification_token` varchar(64) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `couleurs_choisies` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `referral_code_id` int(11) DEFAULT NULL,
  `has_addon` tinyint(1) DEFAULT 0,
  `addon_service_ids` text DEFAULT NULL COMMENT 'Comma-separated list of add-on service IDs',
  `has_healing_addon` tinyint(1) DEFAULT 0,
  `addon_price` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Client reservations';

--
-- Déchargement des données de la table `reservations`
--

INSERT INTO `reservations` (`id`, `client_id`, `service_id`, `date_reservation`, `heure_debut`, `heure_fin`, `statut`, `reservation_status`, `prix_service`, `prix_final`, `client_nom`, `client_prenom`, `client_telephone`, `client_email`, `notes_client`, `verification_code`, `verification_token`, `session_id`, `couleurs_choisies`, `date_creation`, `date_modification`, `referral_code_id`, `has_addon`, `addon_service_ids`, `has_healing_addon`, `addon_price`) VALUES
(5, NULL, 6, '2025-08-23', '15:00:00', '16:05:00', 'en_attente', 'reserved', 130.00, 130.00, 'Frigui', 'Yassine', '22222222', 'friguiyassine750@gmail.com', NULL, '808485', NULL, NULL, NULL, '2025-08-13 21:00:46', '2025-08-13 21:00:46', NULL, 0, NULL, 0, 0.00),
(7, NULL, 6, '2025-08-23', '09:30:00', '10:35:00', 'en_attente', 'reserved', 130.00, 130.00, 'Frigui', 'Yassine', '22222222', 'friguiyassine750@gmail.com', NULL, '455009', NULL, NULL, NULL, '2025-08-13 21:06:38', '2025-08-13 21:06:39', NULL, 0, NULL, 0, 0.00),
(8, NULL, 10, '2025-08-22', '15:30:00', '15:30:00', 'en_attente', 'reserved', 160.00, 160.00, 'Frigui', 'Yassine', '33112233', 'friguiyassine750@gmail.com', '', '218789', NULL, NULL, NULL, '2025-08-13 21:19:53', '2025-08-13 21:21:35', NULL, 0, NULL, 0, 0.00),
(9, 3, 1, '2025-08-25', '10:00:00', '10:10:00', 'en_attente', 'reserved', 40.00, 40.00, 'Test', 'User', '12345678', 'test@example.com', 'Test reservation', '382460', NULL, NULL, NULL, '2025-08-13 21:21:07', '2025-08-13 21:21:08', NULL, 0, NULL, 0, 0.00),
(10, 10, 1, '2025-08-26', '11:00:00', '00:00:00', 'en_attente', 'reserved', 40.00, 40.00, 'Draft', 'User', '87654321', 'draft@example.com', 'Draft test', '533985', NULL, NULL, NULL, '2025-08-13 21:22:02', '2025-08-13 21:22:02', NULL, 0, NULL, 0, 0.00),
(11, 11, 1, '2025-08-27', '14:00:00', '14:10:00', 'en_attente', 'reserved', 40.00, 40.00, 'Email', 'Test', '12345678', 'yassinematoussi42@gmail.com', 'Email test reservation', '221838', '9913d7d7d2f0fce794b1a6d243a6fca69aeb3469b4de9ad8dace312e93597c2f', NULL, NULL, '2025-08-13 21:31:25', '2025-08-13 21:31:47', NULL, 0, NULL, 0, 0.00),
(12, 2, 5, '2025-08-30', '17:00:00', '17:00:00', 'confirmee', 'confirmed', 80.00, 80.00, 'FRIGUI', 'Yassine', '111111111111', 'yassinefrigui9@gmail.com', '', '968720', 'b635c61d30c70282c08fd384b51d609066ea669bb251d9cf662acdcec56e61bd', NULL, NULL, '2025-08-13 21:42:40', '2025-08-13 21:43:53', NULL, 0, NULL, 0, 0.00),
(13, 2, 3, '2025-08-30', '14:30:00', '14:30:00', 'confirmee', 'confirmed', 140.00, 140.00, 'FRIGUI', 'Yassine', '111111111111', 'friguiyassine750@gmail.com', '', '581149', NULL, NULL, NULL, '2025-08-13 21:50:56', '2025-08-13 22:02:04', NULL, 0, NULL, 0, 0.00),
(14, NULL, 4, '2025-07-15', '09:00:00', '09:30:00', 'confirmee', 'draft', 0.00, 0.00, 'Test', 'Test', '55555555', 'tester@gmail.com', '', NULL, NULL, 'booking_1755188649658_6vbexnnekw3', NULL, '2025-08-14 16:24:27', '2025-08-21 17:34:18', NULL, 0, NULL, 0, 0.00),
(15, 13, 11, '2025-09-02', '17:00:00', '17:00:00', 'en_attente', 'reserved', 320.00, 320.00, 'test', 'test', '111111111111', 'test@gmail.com', '', '218622', 'd906ca63cc1df11091e2f73a69c05d5d52166ab70a7e7ffd4b0a6d0ce7275901', NULL, NULL, '2025-08-15 13:36:25', '2025-08-15 13:37:30', NULL, 0, NULL, 0, 0.00),
(16, 15, 5, '2025-08-28', '17:00:00', '17:00:00', 'en_attente', 'reserved', 80.00, 80.00, 'testerr', 'testerr', '99999999', 'testing123456@gmail.com', '', '965742', 'dea6e47e1cb36471f0000ef201d23c946a5dead8da82496f32a9403eb3d24cf4', NULL, NULL, '2025-08-15 14:13:17', '2025-08-15 16:02:22', NULL, 0, NULL, 0, 0.00),
(17, 14, 1, '2025-08-16', '11:00:00', '11:00:00', 'confirmee', 'confirmed', 40.00, 40.00, 'Najjar', 'Sonia', '0021629361740', 'sonyta-n-uk@hotmail.fr', '', '865445', '15bf3e76b2141d73afdd54440e60f2f00cd6c7697535aa2470088912bd5473b8', NULL, NULL, '2025-08-15 15:56:04', '2025-08-15 15:57:04', NULL, 0, NULL, 0, 0.00),
(18, 16, 3, '2025-08-20', '17:00:00', '17:00:00', 'en_attente', 'reserved', 140.00, 140.00, 'test', 'test', '1111111111111', '123@gmail.com', '', '957227', 'c36dc94c84767312642c678c6ab040d3055d1176b03d5cf6058a9904d5e4fe12', NULL, NULL, '2025-08-15 16:03:21', '2025-08-15 16:03:31', NULL, 0, NULL, 0, 0.00),
(19, 17, 3, '2025-08-26', '17:30:00', '17:30:00', 'en_attente', 'reserved', 140.00, 140.00, 'Ziadi', 'Rourou', '52768613', 'rahmaziadi25@gmail.com', '', '204666', '9ee0ea706408e48cbb5c40c11f6785999c29fa4b022e2e409b510313eceec686', NULL, NULL, '2025-08-15 16:29:28', '2025-08-15 16:29:53', NULL, 0, NULL, 0, 0.00),
(20, 5, 9, '2025-08-19', '17:30:00', '17:30:00', 'en_attente', 'reserved', 130.00, 130.00, 'test', 'Yassine', '111111111111', 'testfinal@example.com', '', '668593', '3d43b3ee07c0a2f9c0f571eddf8617af0dfd939bca099cbc0be1b93a8d423bd8', NULL, NULL, '2025-08-15 16:30:51', '2025-08-15 16:30:59', NULL, 0, NULL, 0, 0.00),
(21, 13, 11, '2025-07-15', '09:00:00', '09:30:00', 'en_attente', 'reserved', 320.00, 320.00, 'test', 'Yassine', '22222222222222', 'test@gmail.com', '', '219951', '0d50be28f585b5ebe1edd7ee70861761bb072523fed9f8b5eb2884db131234ec', NULL, NULL, '2025-08-15 16:37:00', '2025-08-15 16:37:40', NULL, 0, NULL, 0, 0.00),
(22, NULL, 8, '2025-08-20', '15:00:00', '15:00:00', 'draft', 'draft', 150.00, 150.00, 'Lamine', 'Sirine', '56280958', 'marcyline1234@yahoo.fr', '', NULL, NULL, 'booking_1755617211646_7zwc091hpxp', NULL, '2025-08-19 15:29:53', '2025-08-23 18:28:21', NULL, 0, NULL, 0, 0.00),
(23, NULL, 2, '2025-07-15', '09:00:00', '09:30:00', 'confirmee', 'draft', 60.00, 60.00, 'Tester', 'Tester', '87654321', 'gester@gmail.com', '', NULL, NULL, 'booking_1755798452972_wthkoqzl3e', NULL, '2025-08-21 17:57:11', '2025-08-21 17:58:32', NULL, 0, NULL, 0, 0.00),
(24, NULL, 4, '2025-07-15', '09:00:00', '09:30:00', 'confirmee', 'draft', 70.00, 70.00, 'Countdown', 'Final', '54325432', 'g@g.com', '', NULL, NULL, 'booking_1755798452972_wthkoqzl3e', NULL, '2025-08-21 17:59:03', '2025-08-21 17:59:48', NULL, 0, NULL, 0, 0.00),
(25, 19, 6, '2025-08-29', '17:30:00', '17:30:00', 'en_attente', 'reserved', 130.00, 130.00, 'Test', 'Test', '12345678', 'sonia.najjar@cgs.com.tn', '', '461814', 'ece98a83d20f011260b4d371f88c64b3a5ee2697c16b1c9a5b4ef71a17e1a56b', NULL, NULL, '2025-08-23 19:09:52', '2025-08-23 19:09:59', NULL, 0, NULL, 0, 0.00),
(26, 12, 6, '2025-08-31', '09:00:00', '09:00:00', 'en_attente', 'reserved', 130.00, 130.00, 'test', 'test', '87654321', 'yassinefrigui9@gmail.com', '', '279200', 'e874aacfeda86a70a1561ac42ba1618fe18b61f7fd0952792ad8471a47886316', NULL, NULL, '2025-08-23 19:11:14', '2025-08-23 19:11:25', NULL, 0, NULL, 0, 0.00);

-- --------------------------------------------------------

--
-- Structure de la table `reservation_addons`
--

CREATE TABLE `reservation_addons` (
  `id` int(11) NOT NULL,
  `reservation_id` int(11) NOT NULL,
  `addon_service_id` int(11) NOT NULL,
  `addon_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reservation_items`
--

CREATE TABLE `reservation_items` (
  `id` int(11) NOT NULL,
  `reservation_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `item_type` enum('main','addon') NOT NULL DEFAULT 'main',
  `prix` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `security_settings`
--

CREATE TABLE `security_settings` (
  `id` int(11) NOT NULL,
  `setting_name` varchar(100) NOT NULL COMMENT 'Setting name',
  `setting_value` text NOT NULL COMMENT 'Setting value',
  `description` text DEFAULT NULL COMMENT 'Setting description',
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Security settings for the application';

--
-- Déchargement des données de la table `security_settings`
--

INSERT INTO `security_settings` (`id`, `setting_name`, `setting_value`, `description`, `date_modification`) VALUES
(3, 'password_reset_token_expiry_hours', '24', 'Password reset token expiry in hours', '2025-08-04 13:16:32'),
(5, 'session_timeout_hours', '24', 'Client session timeout in hours', '2025-08-04 13:16:32'),
(6, 'require_email_verification', '1', 'Require email verification for new accounts', '2025-08-04 13:16:32'),
(7, 'min_password_length', '8', 'Minimum password length', '2025-08-04 13:16:32'),
(8, 'require_password_complexity', '1', 'Require complex passwords (uppercase, lowercase, number, special char)', '2025-08-04 13:16:32'),
(11, 'jwt_secret_rotation_days', '30', 'Days between JWT secret rotation', '2025-08-10 18:34:05'),
(12, 'session_cleanup_interval_hours', '24', 'Hours between session cleanup runs', '2025-08-10 18:34:05'),
(13, 'max_login_attempts', '5', 'Maximum login attempts before temporary lockout', '2025-08-10 18:34:24'),
(14, 'lockout_duration_minutes', '15', 'Duration of temporary lockout in minutes', '2025-08-10 18:34:24');

-- --------------------------------------------------------

--
-- Structure de la table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `nom` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `description_detaillee` text DEFAULT NULL,
  `service_type` enum('base','variant','package','addon') NOT NULL DEFAULT 'base',
  `parent_service_id` int(11) DEFAULT NULL,
  `categorie_id` int(11) DEFAULT NULL,
  `prix` decimal(10,2) NOT NULL,
  `duree` int(11) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `inclus` text DEFAULT NULL,
  `contre_indications` text DEFAULT NULL,
  `conseils_apres_soin` text DEFAULT NULL,
  `nombre_sessions` int(11) DEFAULT NULL,
  `prix_par_session` decimal(10,2) DEFAULT NULL,
  `validite_jours` int(11) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `populaire` tinyint(1) DEFAULT 0,
  `nouveau` tinyint(1) DEFAULT 0,
  `ordre_affichage` int(11) DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Spa services offered';

--
-- Déchargement des données de la table `services`
--

INSERT INTO `services` (`id`, `nom`, `description`, `description_detaillee`, `service_type`, `parent_service_id`, `categorie_id`, `prix`, `duree`, `image_url`, `inclus`, `contre_indications`, `conseils_apres_soin`, `nombre_sessions`, `prix_par_session`, `validite_jours`, `actif`, `populaire`, `nouveau`, `ordre_affichage`, `date_creation`) VALUES
(1, 'Relaxation Steam', 'Bain de vapeur relaxant aux herbes de 10 minutes', NULL, 'base', NULL, 1, 40.00, 10, NULL, 'consultation pré et post-session, boisson gratuite', NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 0, '2025-07-17 13:10:31'),
(2, 'Specialized Steam (10 min)', 'Bain de vapeur spécialisé avec herbes thérapeutiques', NULL, 'base', NULL, 1, 60.00, 10, NULL, 'consultation pré et post-session, boisson gratuite', NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 0, '2025-07-17 13:10:31'),
(3, 'Specialized Steam (30 min)', 'Bain de vapeur spécialisé prolongé pour une détente profonde', NULL, 'base', NULL, 1, 140.00, 30, NULL, 'consultation pré et post-session, boisson gratuite', NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 0, '2025-07-17 13:10:31'),
(4, 'Pre-Wax Ritual', 'Préparation optimale de la peau avant épilation', NULL, 'base', NULL, 2, 70.00, 25, NULL, 'consultation santé de 5 minutes', NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 0, '2025-07-17 13:10:31'),
(5, 'Post-Wax Soothing Ritual', 'Soin apaisant après épilation', NULL, 'base', NULL, 2, 80.00, 35, NULL, 'consultation santé de 5 minutes', NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 0, '2025-07-17 13:10:31'),
(6, 'Restorative Vajacial', 'Soin complet de restauration intime', NULL, 'base', NULL, 2, 130.00, 65, NULL, 'consultation santé de 5 minutes', NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 0, '2025-07-17 13:10:31'),
(7, 'Healing Add-On', 'Enhancement add-on for V-Steam services - provides additional healing benefits', NULL, 'addon', NULL, 1, 30.00, 0, NULL, 'thé aux herbes personnalisé, conseils de style de vie', NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 1, '2025-07-17 13:10:32'),
(8, 'avec épilation', 'Vajacial réparateur avec service d\'épilation inclus', NULL, 'variant', 6, NULL, 150.00, 65, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 1, '2025-07-17 13:10:32'),
(9, 'sans épilation', 'Vajacial réparateur sans épilation', NULL, 'variant', 6, NULL, 130.00, 65, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 2, '2025-07-17 13:10:32'),
(10, 'Pack 5 séances - Relaxation Steam', 'Package de 5 sessions', NULL, 'package', 1, NULL, 160.00, 10, NULL, NULL, NULL, NULL, 5, 32.00, 365, 1, 0, 0, 1, '2025-07-17 13:10:32'),
(11, 'Pack 10 séances - Relaxation Steam', 'Package de 10 sessions', NULL, 'package', 1, NULL, 320.00, 10, NULL, NULL, NULL, NULL, 10, 32.00, 365, 1, 0, 0, 2, '2025-07-17 13:10:32'),
(12, 'Pack 5 séances - Specialized Steam 10min', 'Package de 5 sessions', NULL, 'package', 2, NULL, 240.00, 10, NULL, NULL, NULL, NULL, 5, 48.00, 365, 1, 0, 0, 1, '2025-07-17 13:10:32'),
(13, 'Pack 10 séances - Specialized Steam 10min', 'Package de 10 sessions', NULL, 'package', 2, NULL, 480.00, 10, NULL, NULL, NULL, NULL, 10, 48.00, 365, 1, 0, 0, 2, '2025-07-17 13:10:32');

-- --------------------------------------------------------

--
-- Structure de la table `services_translations`
--

CREATE TABLE `services_translations` (
  `id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `language_code` varchar(5) NOT NULL,
  `nom` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `description_detaillee` text DEFAULT NULL,
  `inclus` text DEFAULT NULL,
  `contre_indications` text DEFAULT NULL,
  `conseils_apres_soin` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `services_translations`
--

INSERT INTO `services_translations` (`id`, `service_id`, `language_code`, `nom`, `description`, `description_detaillee`, `inclus`, `contre_indications`, `conseils_apres_soin`, `date_creation`, `date_modification`) VALUES
(1, 1, 'fr', 'Relaxation Steam', 'Bain de vapeur relaxant aux herbes de 10 minutes', NULL, 'consultation pré et post-session, boisson gratuite', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(2, 2, 'fr', 'Specialized Steam (10 min)', 'Bain de vapeur spécialisé avec herbes thérapeutiques', NULL, 'consultation pré et post-session, boisson gratuite', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(3, 3, 'fr', 'Specialized Steam (30 min)', 'Bain de vapeur spécialisé prolongé pour une détente profonde', NULL, 'consultation pré et post-session, boisson gratuite', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(4, 4, 'fr', 'Pre-Wax Ritual', 'Préparation optimale de la peau avant épilation', NULL, 'consultation santé de 5 minutes', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(5, 5, 'fr', 'Post-Wax Soothing Ritual', 'Soin apaisant après épilation', NULL, 'consultation santé de 5 minutes', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(6, 6, 'fr', 'Restorative Vajacial', 'Soin complet de restauration intime', NULL, 'consultation santé de 5 minutes', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(7, 7, 'fr', 'Healing Add-On', 'Thé aux herbes personnalisé et conseils de style de vie', NULL, 'thé aux herbes personnalisé, conseils de style de vie', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(8, 8, 'fr', 'avec épilation', 'Vajacial réparateur avec service d\'épilation inclus', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(9, 9, 'fr', 'sans épilation', 'Vajacial réparateur sans épilation', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(10, 10, 'fr', 'Pack 5 séances - Relaxation Steam', 'Package de 5 sessions', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(11, 11, 'fr', 'Pack 10 séances - Relaxation Steam', 'Package de 10 sessions', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(12, 12, 'fr', 'Pack 5 séances - Specialized Steam 10min', 'Package de 5 sessions', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(13, 13, 'fr', 'Pack 10 séances - Specialized Steam 10min', 'Package de 10 sessions', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(16, 1, 'en', 'Relaxation Steam', '10-minute relaxing herbal steam bath', NULL, 'pre and post-session consultation, complimentary drink', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(17, 2, 'en', 'Specialized Steam (10 min)', 'Specialized steam bath with therapeutic herbs', NULL, 'pre and post-session consultation, complimentary drink', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(18, 3, 'en', 'Specialized Steam (30 min)', 'Extended specialized steam bath for deep relaxation', NULL, 'pre and post-session consultation, complimentary drink', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(19, 4, 'en', 'Pre-Wax Ritual', 'Optimal skin preparation before hair removal', NULL, '5-minute health consultation', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(20, 5, 'en', 'Post-Wax Soothing Ritual', 'Soothing care after hair removal', NULL, '5-minute health consultation', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(21, 6, 'en', 'Restorative Vajacial', 'Complete intimate restoration treatment', NULL, '5-minute health consultation', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(22, 7, 'en', 'Healing Add-On', 'Personalized herbal tea and lifestyle advice', NULL, 'personalized herbal tea, lifestyle advice', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(23, 8, 'en', 'with hair removal', 'Restorative vajacial with hair removal service included', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(24, 9, 'en', 'without hair removal', 'Restorative vajacial without hair removal', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(25, 10, 'en', '5-session pack - Relaxation Steam', '5-session package', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(26, 11, 'en', '10-session pack - Relaxation Steam', '10-session package', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(27, 12, 'en', '5-session pack - Specialized Steam 10min', '5-session package', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(28, 13, 'en', '10-session pack - Specialized Steam 10min', '10-session package', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(29, 1, 'ar', 'بخار الاسترخاء', 'حمام بخار مريح بالأعشاب لمدة 10 دقائق', NULL, 'استشارة قبل وبعد الجلسة، مشروب مجاني', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(30, 2, 'ar', 'البخار المتخصص (10 دقائق)', 'حمام بخار متخصص بالأعشاب العلاجية', NULL, 'استشارة قبل وبعد الجلسة، مشروب مجاني', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(31, 3, 'ar', 'البخار المتخصص (30 دقيقة)', 'حمام بخار متخصص ممتد للاسترخاء العميق', NULL, 'استشارة قبل وبعد الجلسة، مشروب مجاني', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(32, 4, 'ar', 'طقوس ما قبل إزالة الشعر', 'تحضير مثالي للبشرة قبل إزالة الشعر', NULL, 'استشارة صحية لمدة 5 دقائق', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(33, 5, 'ar', 'طقوس مهدئة بعد إزالة الشعر', 'عناية مهدئة بعد إزالة الشعر', NULL, 'استشارة صحية لمدة 5 دقائق', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(34, 6, 'ar', 'Vajacial الترميمي', 'علاج ترميم حميم كامل', NULL, 'استشارة صحية لمدة 5 دقائق', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(35, 7, 'ar', 'إضافة الشفاء', 'شاي أعشاب مخصص ونصائح نمط الحياة', NULL, 'شاي أعشاب مخصص، نصائح نمط الحياة', NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(36, 8, 'ar', 'مع إزالة الشعر', 'Vajacial ترميمي مع خدمة إزالة الشعر المدرجة', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(37, 9, 'ar', 'بدون إزالة الشعر', 'Vajacial ترميمي بدون إزالة الشعر', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(38, 10, 'ar', 'باقة 5 جلسات - بخار الاسترخاء', 'باقة 5 جلسات', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(39, 11, 'ar', 'باقة 10 جلسات - بخار الاسترخاء', 'باقة 10 جلسات', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(40, 12, 'ar', 'باقة 5 جلسات - البخار المتخصص 10 دقائق', 'باقة 5 جلسات', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(41, 13, 'ar', 'باقة 10 جلسات - البخار المتخصص 10 دقائق', 'باقة 10 جلسات', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `role` enum('admin','employe','super_admin') DEFAULT 'employe',
  `actif` tinyint(1) DEFAULT 1,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `nom`, `email`, `mot_de_passe`, `role`, `actif`, `date_creation`) VALUES
(1, 'Admin ZenShe', 'admin@zenshe.ca', '$2b$12$rOz8kWKKU5PjU7eGBEtNruQcL4M2FT8Vh5XGjGVOhKQnhK5M4C4sO', 'super_admin', 1, '2025-07-17 13:10:32');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `avis_clients`
--
ALTER TABLE `avis_clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client_avis` (`client_id`),
  ADD KEY `idx_date_avis` (`date_avis`),
  ADD KEY `idx_visible` (`visible`);

--
-- Index pour la table `categories_services`
--
ALTER TABLE `categories_services`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `categories_services_translations`
--
ALTER TABLE `categories_services_translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_language` (`category_id`,`language_code`),
  ADD KEY `idx_category_id` (`category_id`),
  ADD KEY `idx_language_code` (`language_code`),
  ADD KEY `idx_category_language` (`category_id`,`language_code`);

--
-- Index pour la table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_unique` (`email`),
  ADD KEY `idx_clients_email_mot_de_passe` (`email`,`mot_de_passe`),
  ADD KEY `idx_clients_statut` (`statut`),
  ADD KEY `idx_clients_langue_preferee` (`langue_preferee`),
  ADD KEY `idx_clients_statut_simple` (`statut`),
  ADD KEY `referred_by_code_id` (`referred_by_code_id`);

--
-- Index pour la table `client_login_attempts`
--
ALTER TABLE `client_login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_ip_address` (`ip_address`),
  ADD KEY `idx_attempted_at` (`attempted_at`),
  ADD KEY `idx_success` (`success`);

--
-- Index pour la table `client_sessions`
--
ALTER TABLE `client_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client_sessions_client_id` (`client_id`),
  ADD KEY `idx_client_sessions_expires` (`expires`),
  ADD KEY `idx_client_sessions_created_at` (`created_at`),
  ADD KEY `idx_token` (`token`(255)),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Index pour la table `client_verification_tokens`
--
ALTER TABLE `client_verification_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_token` (`token`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_token_type` (`token`,`type`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Index pour la table `creneaux_horaires`
--
ALTER TABLE `creneaux_horaires`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `fermetures_exceptionnelles`
--
ALTER TABLE `fermetures_exceptionnelles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_date` (`date_fermeture`);

--
-- Index pour la table `inventaire`
--
ALTER TABLE `inventaire`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_code_produit` (`code_produit`),
  ADD KEY `idx_marque` (`marque`),
  ADD KEY `idx_type_produit` (`type_produit`),
  ADD KEY `idx_stock_status` (`quantite_stock`,`quantite_minimum`),
  ADD KEY `idx_fournisseur` (`fournisseur`);

--
-- Index pour la table `memberships`
--
ALTER TABLE `memberships`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `memberships_translations`
--
ALTER TABLE `memberships_translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_membership_language` (`membership_id`,`language_code`),
  ADD KEY `idx_membership_id` (`membership_id`),
  ADD KEY `idx_language_code` (`language_code`),
  ADD KEY `idx_membership_language` (`membership_id`,`language_code`);

--
-- Index pour la table `parametres_salon`
--
ALTER TABLE `parametres_salon`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `parametres_salon_translations`
--
ALTER TABLE `parametres_salon_translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_parametre_language` (`parametre_id`,`language_code`),
  ADD KEY `idx_parametre_id` (`parametre_id`),
  ADD KEY `idx_language_code` (`language_code`),
  ADD KEY `idx_parametre_language` (`parametre_id`,`language_code`);

--
-- Index pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_hash` (`token_hash`),
  ADD KEY `idx_token_hash` (`token_hash`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Index pour la table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_promo` (`code_promo`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `categorie_id` (`categorie_id`),
  ADD KEY `idx_dates` (`date_debut`,`date_fin`),
  ADD KEY `idx_code` (`code_promo`),
  ADD KEY `idx_actif` (`actif`);

--
-- Index pour la table `referral_codes`
--
ALTER TABLE `referral_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_referral_codes_code` (`code`),
  ADD KEY `idx_referral_codes_owner` (`owner_client_id`);

--
-- Index pour la table `referral_usage`
--
ALTER TABLE `referral_usage`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_code` (`referral_code_id`,`used_by_client_id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `idx_referral_usage_client` (`used_by_client_id`);

--
-- Index pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_service_id` (`service_id`),
  ADD KEY `idx_date_reservation` (`date_reservation`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_reservation_status` (`reservation_status`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_client_phone` (`client_telephone`),
  ADD KEY `idx_client_lookup` (`client_telephone`,`client_nom`,`client_prenom`),
  ADD KEY `referral_code_id` (`referral_code_id`);

--
-- Index pour la table `reservation_addons`
--
ALTER TABLE `reservation_addons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_reservation_addon` (`reservation_id`,`addon_service_id`),
  ADD KEY `addon_service_id` (`addon_service_id`);

--
-- Index pour la table `reservation_items`
--
ALTER TABLE `reservation_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reservation` (`reservation_id`),
  ADD KEY `idx_service` (`service_id`),
  ADD KEY `idx_type` (`item_type`);

--
-- Index pour la table `security_settings`
--
ALTER TABLE `security_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_setting_name` (`setting_name`);

--
-- Index pour la table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_service_type` (`service_type`),
  ADD KEY `idx_parent_service` (`parent_service_id`),
  ADD KEY `idx_categorie` (`categorie_id`),
  ADD KEY `idx_actif` (`actif`);

--
-- Index pour la table `services_translations`
--
ALTER TABLE `services_translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_service_language` (`service_id`,`language_code`),
  ADD KEY `idx_service_id` (`service_id`),
  ADD KEY `idx_language_code` (`language_code`),
  ADD KEY `idx_service_language` (`service_id`,`language_code`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `avis_clients`
--
ALTER TABLE `avis_clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `categories_services`
--
ALTER TABLE `categories_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `categories_services_translations`
--
ALTER TABLE `categories_services_translations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT pour la table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT pour la table `client_login_attempts`
--
ALTER TABLE `client_login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `client_verification_tokens`
--
ALTER TABLE `client_verification_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `creneaux_horaires`
--
ALTER TABLE `creneaux_horaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `fermetures_exceptionnelles`
--
ALTER TABLE `fermetures_exceptionnelles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `inventaire`
--
ALTER TABLE `inventaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `memberships`
--
ALTER TABLE `memberships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `memberships_translations`
--
ALTER TABLE `memberships_translations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `parametres_salon`
--
ALTER TABLE `parametres_salon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `parametres_salon_translations`
--
ALTER TABLE `parametres_salon_translations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `referral_codes`
--
ALTER TABLE `referral_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `referral_usage`
--
ALTER TABLE `referral_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT pour la table `reservation_addons`
--
ALTER TABLE `reservation_addons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `reservation_items`
--
ALTER TABLE `reservation_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `security_settings`
--
ALTER TABLE `security_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT pour la table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `services_translations`
--
ALTER TABLE `services_translations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `avis_clients`
--
ALTER TABLE `avis_clients`
  ADD CONSTRAINT `avis_clients_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `categories_services_translations`
--
ALTER TABLE `categories_services_translations`
  ADD CONSTRAINT `categories_services_translations_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories_services` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`referred_by_code_id`) REFERENCES `referral_codes` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `client_login_attempts`
--
ALTER TABLE `client_login_attempts`
  ADD CONSTRAINT `client_login_attempts_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `client_sessions`
--
ALTER TABLE `client_sessions`
  ADD CONSTRAINT `client_sessions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `client_verification_tokens`
--
ALTER TABLE `client_verification_tokens`
  ADD CONSTRAINT `client_verification_tokens_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `memberships_translations`
--
ALTER TABLE `memberships_translations`
  ADD CONSTRAINT `memberships_translations_ibfk_1` FOREIGN KEY (`membership_id`) REFERENCES `memberships` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `parametres_salon_translations`
--
ALTER TABLE `parametres_salon_translations`
  ADD CONSTRAINT `parametres_salon_translations_ibfk_1` FOREIGN KEY (`parametre_id`) REFERENCES `parametres_salon` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `promotions`
--
ALTER TABLE `promotions`
  ADD CONSTRAINT `promotions_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `promotions_ibfk_2` FOREIGN KEY (`categorie_id`) REFERENCES `categories_services` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `referral_codes`
--
ALTER TABLE `referral_codes`
  ADD CONSTRAINT `referral_codes_ibfk_1` FOREIGN KEY (`owner_client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `referral_usage`
--
ALTER TABLE `referral_usage`
  ADD CONSTRAINT `referral_usage_ibfk_1` FOREIGN KEY (`referral_code_id`) REFERENCES `referral_codes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `referral_usage_ibfk_2` FOREIGN KEY (`used_by_client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `referral_usage_ibfk_3` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `reservations_ibfk_3` FOREIGN KEY (`referral_code_id`) REFERENCES `referral_codes` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `reservation_addons`
--
ALTER TABLE `reservation_addons`
  ADD CONSTRAINT `reservation_addons_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservation_addons_ibfk_2` FOREIGN KEY (`addon_service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reservation_items`
--
ALTER TABLE `reservation_items`
  ADD CONSTRAINT `reservation_items_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservation_items_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`categorie_id`) REFERENCES `categories_services` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `services_ibfk_2` FOREIGN KEY (`parent_service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `services_translations`
--
ALTER TABLE `services_translations`
  ADD CONSTRAINT `services_translations_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
