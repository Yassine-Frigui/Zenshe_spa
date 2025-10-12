-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:4306
-- Généré le : dim. 12 oct. 2025 à 19:40
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

DELIMITER $$
--
-- Procédures
--
CREATE DEFINER=`` PROCEDURE `sp_activate_scheduled_membership` (IN `p_scheduled_id` INT, IN `p_admin_id` INT, IN `p_methode_paiement` ENUM('cash','card','bank_transfer','online'), OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(255))   BEGIN
    DECLARE v_client_id INT;
    DECLARE v_existing_active INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_success = FALSE;
        SET p_message = 'Erreur lors de l\'activation de l\'abonnement';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- Check if scheduled membership exists and is pending
    SELECT client_id INTO v_client_id
    FROM client_memberships
    WHERE id = p_scheduled_id AND statut = 'pending';

    IF v_client_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Abonnement planifié non trouvé ou déjà activé';
        ROLLBACK;
    ELSE
        -- Check if client already has active membership
        SELECT COUNT(*) INTO v_existing_active
        FROM client_memberships
        WHERE client_id = v_client_id
        AND statut = 'active'
        AND date_fin > CURDATE();

        IF v_existing_active > 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Le client a déjà un abonnement actif';
            ROLLBACK;
        ELSE
            -- Activate the scheduled membership
            UPDATE client_memberships
            SET statut = 'active',
                date_activated = NOW(),
                activated_by = p_admin_id,
                mode_paiement = p_methode_paiement
            WHERE id = p_scheduled_id;

            SET p_success = TRUE;
            SET p_message = 'Abonnement activé avec succès';
        END IF;
    END IF;

    COMMIT;
END$$

CREATE DEFINER=`` PROCEDURE `sp_check_active_membership` (IN `p_client_id` INT, OUT `p_has_active` BOOLEAN, OUT `p_client_membership_id` INT, OUT `p_services_restants` INT, OUT `p_membership_nom` VARCHAR(100))   BEGIN
    SELECT 
        TRUE,
        id,
        services_restants,
        (SELECT nom FROM memberships WHERE id = membership_id)
    INTO 
        p_has_active,
        p_client_membership_id,
        p_services_restants,
        p_membership_nom
    FROM client_memberships
    WHERE client_id = p_client_id
        AND statut = 'active'
        AND date_fin >= CURDATE()
        AND services_restants > 0
    ORDER BY date_fin DESC
    LIMIT 1;
    
    -- If no row found, set defaults
    IF p_client_membership_id IS NULL THEN
        SET p_has_active = FALSE;
        SET p_services_restants = 0;
        SET p_membership_nom = NULL;
    END IF;
END$$

CREATE DEFINER=`` PROCEDURE `sp_purchase_membership` (IN `p_client_id` INT, IN `p_membership_id` INT, IN `p_date_debut` DATE, IN `p_date_fin` DATE, IN `p_montant` DECIMAL(10,2), IN `p_mode_paiement` ENUM('cash','card','bank_transfer','online'), IN `p_duree_mois` INT, IN `p_services_total` INT, IN `p_notes` TEXT, IN `p_is_scheduled` BOOLEAN, OUT `p_membership_id_out` INT, OUT `p_message` VARCHAR(255))   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_membership_id_out = NULL;
        SET p_message = 'Erreur lors de la création de l\'abonnement';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- Check if client already has active membership (only for immediate purchase)
    IF p_is_scheduled = FALSE THEN
        IF EXISTS (
            SELECT 1 FROM client_memberships
            WHERE client_id = p_client_id
            AND statut IN ('active', 'pending')
            AND date_fin > CURDATE()
        ) THEN
            SET p_membership_id_out = NULL;
            SET p_message = 'Le client a déjà un abonnement actif ou en attente';
            ROLLBACK;
        ELSE
            -- Create active membership
            INSERT INTO client_memberships (
                client_id, membership_id, date_debut, date_fin,
                montant_paye, mode_paiement, duree_engagement,
                services_total, statut, notes
            ) VALUES (
                p_client_id, p_membership_id, p_date_debut, p_date_fin,
                p_montant, p_mode_paiement, p_duree_mois,
                p_services_total, 'active', p_notes
            );

            SET p_membership_id_out = LAST_INSERT_ID();
            SET p_message = 'Abonnement créé avec succès';
        END IF;
    ELSE
        -- Check if client already has pending scheduled membership
        IF EXISTS (
            SELECT 1 FROM client_memberships
            WHERE client_id = p_client_id
            AND statut = 'pending'
        ) THEN
            SET p_membership_id_out = NULL;
            SET p_message = 'Le client a déjà un abonnement planifié en attente';
            ROLLBACK;
        ELSE
            -- Create scheduled membership (pending status)
            INSERT INTO client_memberships (
                client_id, membership_id, date_debut, date_fin,
                montant_paye, mode_paiement, duree_engagement,
                services_total, statut, notes
            ) VALUES (
                p_client_id, p_membership_id, p_date_debut, p_date_fin,
                p_montant, p_mode_paiement, p_duree_mois,
                p_services_total, 'pending', p_notes
            );

            SET p_membership_id_out = LAST_INSERT_ID();
            SET p_message = 'Abonnement planifié avec succès';
        END IF;
    END IF;

    COMMIT;
END$$

--
-- Fonctions
--
CREATE DEFINER=`` FUNCTION `get_reservation_services` (`res_id` INT) RETURNS TEXT CHARSET utf8mb4 COLLATE utf8mb4_general_ci DETERMINISTIC READS SQL DATA BEGIN
    DECLARE service_list TEXT;
    
    -- Check if reservation uses items table
    IF (SELECT uses_items_table FROM reservations WHERE id = res_id) = 1 THEN
        -- Get services from reservation_items
        SELECT GROUP_CONCAT(s.nom ORDER BY ri.item_type, s.nom SEPARATOR ', ')
        INTO service_list
        FROM reservation_items ri
        JOIN services s ON ri.service_id = s.id
        WHERE ri.reservation_id = res_id;
    ELSE
        -- Get single service from reservations table
        SELECT s.nom
        INTO service_list
        FROM reservations r
        JOIN services s ON r.service_id = s.id
        WHERE r.id = res_id;
    END IF;
    
    RETURN COALESCE(service_list, 'No services');
END$$

DELIMITER ;

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
(6, '??pilation', 'Services d\'??pilation professionnels incluant la cire br??silienne', '#8aaba9', 6, 1, '2025-07-17 13:10:31');

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
(3, 3, 'fr', 'Massages', 'Massages des pieds, du dos et des yeux avec ??quipements sp??cialis??s', '2025-08-04 13:16:48', '2025-10-10 20:46:01'),
(4, 4, 'fr', 'Rituels ZenShe', 'Combinaisons de soins pour une expérience complète de bien-être', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(5, 5, 'fr', 'Spa Capillaire Japonais', 'Détox botanique du cuir chevelu avec produits La Biosthetique', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(6, 6, 'fr', 'Épilation', 'Services d\'épilation professionnels', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(8, 1, 'en', 'V-Steam', 'Vaginal herbal steaming with pre and post-session consultation plus complimentary drink', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(9, 2, 'en', 'Vajacials', 'Three-step intimate care protocol with 5-minute health consultation', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(10, 3, 'en', 'Massages', 'Feet, back and eye massages with specialized equipment', '2025-08-04 13:16:48', '2025-10-10 20:46:01'),
(11, 4, 'en', 'ZenShe Rituals', 'Care combinations for a complete wellness experience', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(12, 5, 'en', 'Japanese Hair Spa', 'Botanical scalp detox with La Biosthetique products', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(13, 6, 'en', 'Hair Removal', 'Professional hair removal services', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(14, 1, 'ar', 'V-Steam', 'حمام البخار المهبلي بالأعشاب مع استشارة قبل وبعد الجلسة بالإضافة إلى مشروب مجاني', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(15, 2, 'ar', 'Vajacials', 'بروتوكول العناية الحميمة من ثلاث خطوات مع استشارة صحية لمدة 5 دقائق', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(16, 3, 'ar', '??????????????', '?????????? ?????????????? ???????????? ?????????????? ???????????? ????????????', '2025-08-04 13:16:48', '2025-10-10 20:46:01'),
(17, 4, 'ar', 'طقوس زين شي', 'مجموعات العناية لتجربة عافية كاملة', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(18, 5, 'ar', 'سبا الشعر الياباني', 'إزالة السموم النباتية من فروة الرأس بمنتجات La Biosthetique', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(19, 6, 'ar', '?????????? ??????????', '?????????? ?????????? ?????????? ???????????????????? ?????? ???? ?????? ?????????? ??????????????????', '2025-08-04 13:16:48', '2025-10-10 20:46:01');

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
  `referred_by_code_id` int(11) DEFAULT NULL,
  `client_type` enum('spa_only','store_only','both') DEFAULT 'spa_only'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Simplified client table - removed unused security features';

--
-- Déchargement des données de la table `clients`
--

INSERT INTO `clients` (`id`, `prenom`, `nom`, `email`, `mot_de_passe`, `email_verifie`, `langue_preferee`, `statut`, `telephone`, `date_naissance`, `adresse`, `notes`, `actif`, `date_creation`, `date_modification`, `referred_by_code_id`, `client_type`) VALUES
(1, 'Marie', 'Dupont', 'marie.dupont@email.com', NULL, 1, 'fr', 'actif', '514-555-0123', NULL, NULL, NULL, 1, '2025-07-17 13:10:32', '2025-08-04 13:16:32', NULL, 'spa_only'),
(2, 'Yassine', 'FRIGUI', 'friguiyassine750@gmail.com', NULL, 1, 'fr', 'actif', '111111111111', NULL, NULL, NULL, 1, '2025-07-17 19:31:32', '2025-08-13 21:52:31', NULL, 'spa_only'),
(3, 'User', 'Test', 'test@example.com', '$2a$12$OxMRvS0TtDBXo4orwxeLwe2nJjp1bpI3FbCcGNzh8IgjbULXUJYQ2', 0, 'fr', 'actif', '12345678', NULL, NULL, NULL, 1, '2025-08-13 11:40:58', '2025-08-13 21:21:07', NULL, 'spa_only'),
(4, 'User2', 'Test2', 'test2@example.com', '$2a$12$caV6dfVcBNyCmTl4u55pRuIaMTQUKkPO/DQel4j4eoG27fJOhvk1m', 0, 'fr', 'actif', '1234567890', NULL, NULL, NULL, 1, '2025-08-13 11:42:56', '2025-08-13 11:42:56', NULL, 'spa_only'),
(5, 'Jotform', 'Tester', 'testfinal@example.com', '$2a$12$5Y.q3PdcgooixeL6K5GRlOKavxJNA0NjF25rFpu3rjbMiEp5tBBdm', 1, 'fr', 'actif', '55669988', NULL, NULL, NULL, 1, '2025-08-13 11:48:58', '2025-10-08 14:02:46', NULL, 'spa_only'),
(6, 'Yassine', 'FRIGUI', 'riff3183@gmail.com', '$2a$12$jZQkXwT46JwSVV4yd4rsDeivFf79yQJ8O4vGayRq8IiUqShAm/emK', 1, 'fr', 'actif', '+21699999999', NULL, NULL, NULL, 1, '2025-08-13 18:10:54', '2025-08-13 18:10:54', NULL, 'spa_only'),
(10, 'User', 'Draft', 'draft@example.com', NULL, 0, 'fr', 'actif', '87654321', NULL, NULL, NULL, 1, '2025-08-13 21:22:02', '2025-08-13 21:22:02', NULL, 'spa_only'),
(11, 'Test', 'Email', 'yassinematoussi42@gmail.com', NULL, 0, 'fr', 'actif', '12345678', NULL, NULL, NULL, 1, '2025-08-13 21:31:25', '2025-08-13 21:31:25', NULL, 'spa_only'),
(12, 'Yassine', 'FRIGUI', 'yassinefrigui9@gmail.com', '$2a$12$LvD27O7YwzZFmeSzFiD9Du5c9JaqJUfGMQHbDtFqVim5XA9ou9fLa', 1, 'fr', 'actif', '22332233', NULL, NULL, NULL, 1, '2025-08-13 22:44:35', '2025-10-08 11:19:03', NULL, 'spa_only'),
(13, 'Yassine', 'test', 'test@gmail.com', NULL, 0, 'fr', 'actif', '22222222222222', NULL, NULL, NULL, 1, '2025-08-15 13:36:30', '2025-08-15 16:37:38', NULL, 'spa_only'),
(14, 'Sonia', 'Najjar', 'sonyta-n-uk@hotmail.fr', NULL, 0, 'fr', 'actif', '0021629361740', NULL, NULL, NULL, 1, '2025-08-15 15:56:26', '2025-08-15 15:56:26', NULL, 'spa_only'),
(15, 'testerr', 'testerr', 'testing123456@gmail.com', NULL, 0, 'fr', 'actif', '99999999', NULL, NULL, NULL, 1, '2025-08-15 16:02:21', '2025-08-15 16:02:21', NULL, 'spa_only'),
(16, 'test', 'test', '123@gmail.com', NULL, 0, 'fr', 'actif', '1111111111111', NULL, NULL, NULL, 1, '2025-08-15 16:03:29', '2025-08-15 16:03:29', NULL, 'spa_only'),
(17, 'Rourou', 'Ziadi', 'rahmaziadi25@gmail.com', NULL, 0, 'fr', 'actif', '52768613', NULL, NULL, NULL, 1, '2025-08-15 16:29:51', '2025-08-15 16:29:51', NULL, 'spa_only'),
(18, 'Sirine', 'Lamine', 'marcyline1234@yahoo.fr', NULL, 0, 'fr', 'actif', '56280958', NULL, NULL, NULL, 1, '2025-08-19 15:30:01', '2025-08-19 15:30:18', NULL, 'spa_only'),
(19, 'Test', 'Test', 'sonia.najjar@cgs.com.tn', NULL, 0, 'fr', 'actif', '12345678', NULL, NULL, NULL, 1, '2025-08-23 19:09:59', '2025-08-23 19:09:59', NULL, 'spa_only'),
(20, 'Client', 'Test', 'testclient1757852224243@example.com', '$2b$12$f395A.egvOCJV2vZ2D5dqOHQSw.qN/7haKM6ttGiuXUqUB6UDo.4e', 1, 'fr', 'actif', '+21612345678', NULL, NULL, NULL, 1, '2025-09-14 12:17:05', '2025-09-14 12:17:05', NULL, 'spa_only'),
(24, 'AutoGeneration', 'Test', 'test_1758107914503@example.com', NULL, 0, 'fr', 'actif', '99887766', NULL, NULL, NULL, 1, '2025-09-17 11:18:34', '2025-09-17 11:18:34', NULL, 'spa_only'),
(25, 'AutoGeneration', 'Test', 'test_1758107939000@example.com', NULL, 0, 'fr', 'actif', '99887766', NULL, NULL, NULL, 1, '2025-09-17 11:18:59', '2025-09-17 11:18:59', NULL, 'spa_only'),
(26, 'AutoGeneration', 'Test', 'test_1758107950322@example.com', NULL, 0, 'fr', 'actif', '99887766', NULL, NULL, NULL, 1, '2025-09-17 11:19:10', '2025-09-17 11:19:10', NULL, 'spa_only'),
(27, 'Sophie', 'TestAutomate', 'test.1759852645023@zenshe.com', NULL, 0, 'fr', 'actif', '+33612345678', '1992-08-20', NULL, NULL, 1, '2025-10-07 15:57:28', '2025-10-07 15:57:28', NULL, 'spa_only'),
(28, 'Sophie', 'TEST TEST TEST ETST ', 'test.1759853109590@zenshe.com', NULL, 0, 'fr', 'actif', '+216 12345678', '1992-08-20', NULL, NULL, 1, '2025-10-07 16:05:12', '2025-10-07 16:05:12', NULL, 'spa_only'),
(29, 'Sophie', 'Testeur_yas', 'test.1759853346337@zenshe.com', NULL, 0, 'fr', 'actif', '+216 12345678', '1992-08-20', NULL, NULL, 1, '2025-10-07 16:09:10', '2025-10-07 16:09:10', NULL, 'spa_only'),
(30, 'tester', 'tester', 'eee@e.com', NULL, 0, 'fr', 'actif', '12345873', NULL, NULL, NULL, 1, '2025-10-08 11:45:52', '2025-10-08 11:45:52', NULL, 'spa_only'),
(31, 'Yassine', 'FRIGUI', 'fellasinparis@gmail.com', '$2b$12$7tQtjiGpuprHUrE3apcLSupS8xmwDsXmCq0f1NQTeJo7iTxKesc9a', 1, 'fr', 'actif', '+21667321232', NULL, NULL, NULL, 1, '2025-10-11 08:38:15', '2025-10-11 08:38:15', NULL, 'spa_only');

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
-- Structure de la table `client_memberships`
--

CREATE TABLE `client_memberships` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `membership_id` int(11) NOT NULL,
  `date_debut` date NOT NULL COMMENT 'Start date of membership period',
  `date_fin` date NOT NULL COMMENT 'End date of membership period',
  `statut` enum('active','expired','cancelled','pending') DEFAULT 'active' COMMENT 'Membership status',
  `services_total` int(11) NOT NULL COMMENT 'Total services allowed per period',
  `services_utilises` int(11) DEFAULT 0 COMMENT 'Number of services used',
  `services_restants` int(11) GENERATED ALWAYS AS (`services_total` - `services_utilises`) STORED COMMENT 'Remaining services (auto-calculated)',
  `montant_paye` decimal(10,2) NOT NULL COMMENT 'Amount paid for this membership',
  `mode_paiement` enum('cash','card','bank_transfer','online') NOT NULL COMMENT 'Payment method',
  `duree_engagement` int(11) DEFAULT 1 COMMENT 'Duration in months (1 or 3)',
  `notes` text DEFAULT NULL COMMENT 'Admin notes about this membership',
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_activated` datetime DEFAULT NULL COMMENT 'When admin activated the scheduled membership',
  `date_cancelled` datetime DEFAULT NULL COMMENT 'When membership was cancelled',
  `activated_by` int(11) DEFAULT NULL COMMENT 'Admin user ID who activated the membership'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks client membership subscriptions and usage';

--
-- Déchargement des données de la table `client_memberships`
--

INSERT INTO `client_memberships` (`id`, `client_id`, `membership_id`, `date_debut`, `date_fin`, `statut`, `services_total`, `services_utilises`, `montant_paye`, `mode_paiement`, `duree_engagement`, `notes`, `date_creation`, `date_modification`, `date_activated`, `date_cancelled`, `activated_by`) VALUES
(1, 12, 2, '2025-10-11', '2025-11-11', 'active', 5, 0, 325.00, 'card', 1, NULL, '2025-10-11 07:30:18', '2025-10-11 07:30:18', NULL, NULL, NULL),
(2, 12, 2, '2025-10-11', '2026-01-11', 'pending', 15, 0, 550.00, 'cash', 3, 'Scheduled membership - to be activated at spa visit', '2025-10-11 08:58:09', '2025-10-11 08:58:09', NULL, NULL, NULL);

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
-- Structure de la table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `detailed_description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `gallery_images` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `weight` decimal(8,2) DEFAULT 0.00,
  `dimensions` varchar(100) DEFAULT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_preorder` tinyint(1) DEFAULT 1 COMMENT 'All items are pre-order by default',
  `estimated_delivery_days` int(11) DEFAULT 14 COMMENT 'Estimated delivery time in days'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `detailed_description`, `price`, `category`, `category_id`, `image_url`, `gallery_images`, `is_active`, `is_featured`, `weight`, `dimensions`, `sku`, `created_at`, `updated_at`, `is_preorder`, `estimated_delivery_days`) VALUES
(1, 'Chaise de Spa Luxe ZS001', 'Chaise de spa professionnelle avec fonction massage', 'Chaise de spa luxueuse avec fonction massage, hauteur ajustable et revêtement en cuir premium. Parfaite pour tout spa ou centre de bien-être.', 2500.00, 'Chaises de Spa', 1, '/images/products/chaise-spa.jpg', NULL, 1, 1, 0.00, NULL, 'ZS001-SPA-CHAIR', '2025-09-16 07:58:41', '2025-10-09 22:40:20', 1, 14),
(2, 'Lit de Soins du Visage Professionnel', 'Lit ajustable pour soins du visage avec coussin mémoire de forme', 'Lit professionnel ajustable pour soins du visage avec coussin en mousse à mémoire de forme et surface vinyle facile à nettoyer.', 1200.00, 'Équipements', 4, '/images/products/lit-soins-des-visages.jpg', NULL, 1, 0, 0.00, NULL, 'ZS002-FACIAL-BED', '2025-09-16 07:58:41', '2025-10-09 22:40:33', 1, 14),
(3, 'Sérum Visage Bio Anti-Âge', 'Sérum visage bio premium anti-âge aux ingrédients naturels', 'Sérum visage bio premium anti-âge avec des ingrédients naturels pour une peau radieuse et jeune.', 89.99, 'Produits de Soins', 2, '/images/products/serum-visage.jpg', NULL, 1, 1, 0.00, NULL, 'ZS003-SERUM', '2025-09-16 07:58:41', '2025-10-09 22:40:44', 1, 14);

-- --------------------------------------------------------

--
-- Structure de la table `product_categories`
--

CREATE TABLE `product_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `product_categories`
--

INSERT INTO `product_categories` (`id`, `name`, `description`, `image_url`, `is_active`, `display_order`, `created_at`) VALUES
(1, 'Chaises de Spa', 'Chaises et équipements de spa professionnels', NULL, 1, 1, '2025-09-16 07:58:20'),
(2, 'Produits de Soins', 'Crèmes, huiles et produits de beauté', NULL, 1, 2, '2025-09-16 07:58:20'),
(3, 'Accessoires', 'Accessoires et outils pour les soins', NULL, 1, 3, '2025-09-16 07:58:20'),
(4, 'Équipements', 'Matériel et équipements professionnels', NULL, 1, 4, '2025-09-16 07:58:20');

-- --------------------------------------------------------

--
-- Structure de la table `product_category_translations`
--

CREATE TABLE `product_category_translations` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `language_code` varchar(5) NOT NULL COMMENT 'Language code: en, fr, ar',
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `product_category_translations`
--

INSERT INTO `product_category_translations` (`id`, `category_id`, `language_code`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'fr', 'Chaises de Spa', 'Chaises et équipements de spa professionnels', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(2, 1, 'en', 'Spa Chairs', 'Professional spa chairs and equipment', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(3, 1, 'ar', 'كراسي السبا', 'كراسي ومعدات السبا الاحترافية', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(4, 2, 'fr', 'Produits de Soins', 'Crèmes, huiles et produits de beauté', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(5, 2, 'en', 'Care Products', 'Creams, oils and beauty products', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(6, 2, 'ar', 'منتجات العناية', 'كريمات وزيوت ومنتجات تجميل', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(7, 3, 'fr', 'Accessoires', 'Accessoires et outils pour les soins', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(8, 3, 'en', 'Accessories', 'Accessories and tools for treatments', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(9, 3, 'ar', 'إكسسوارات', 'إكسسوارات وأدوات للعلاجات', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(10, 4, 'fr', 'Équipements', 'Matériel et équipements professionnels', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(11, 4, 'en', 'Equipment', 'Professional material and equipment', '2025-10-09 22:12:01', '2025-10-09 22:12:01'),
(12, 4, 'ar', 'معدات', 'مواد ومعدات احترافية', '2025-10-09 22:12:01', '2025-10-09 22:12:01');

-- --------------------------------------------------------

--
-- Structure de la table `product_translations`
--

CREATE TABLE `product_translations` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `language_code` varchar(5) NOT NULL COMMENT 'Language code: en, fr, ar',
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `detailed_description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `product_translations`
--

INSERT INTO `product_translations` (`id`, `product_id`, `language_code`, `name`, `description`, `detailed_description`, `created_at`, `updated_at`) VALUES
(1, 1, 'fr', 'Chaise de Spa Luxe ZS001', 'Chaise de spa professionnelle avec fonction massage', 'Chaise de spa luxueuse avec fonction massage, hauteur ajustable et revêtement en cuir premium. Parfaite pour tout spa ou centre de bien-être.', '2025-10-09 22:12:00', '2025-10-09 22:12:00'),
(2, 1, 'en', 'ZS001 Luxury Spa Chair', 'Professional spa chair with massage function', 'Luxurious spa chair with massage function, adjustable height and premium leather upholstery. Perfect for any spa or wellness center.', '2025-10-09 22:12:00', '2025-10-09 22:12:00'),
(3, 1, 'ar', 'كرسي سبا فاخر ZS001', 'كرسي سبا احترافي مع وظيفة التدليك', 'كرسي سبا فاخر مع وظيفة التدليك، ارتفاع قابل للتعديل وتنجيد جلدي فاخر. مثالي لأي سبا أو مركز عافية.', '2025-10-09 22:12:00', '2025-10-09 22:12:00'),
(4, 2, 'fr', 'Lit de Soins du Visage Professionnel', 'Lit ajustable pour soins du visage avec coussin mémoire de forme', 'Lit professionnel ajustable pour soins du visage avec coussin en mousse à mémoire de forme et surface vinyle facile à nettoyer.', '2025-10-09 22:12:00', '2025-10-09 22:12:00'),
(5, 2, 'en', 'Professional Facial Treatment Bed', 'Adjustable facial treatment bed with memory foam cushion', 'Professional adjustable facial treatment bed with memory foam cushion and easy-to-clean vinyl surface.', '2025-10-09 22:12:00', '2025-10-09 22:12:00'),
(6, 2, 'ar', 'سرير علاج الوجه الاحترافي', 'سرير علاج الوجه القابل للتعديل مع وسادة إسفنجية بذاكرة الشكل', 'سرير علاج الوجه الاحترافي القابل للتعديل مع وسادة إسفنجية بذاكرة الشكل وسطح فينيل سهل التنظيف.', '2025-10-09 22:12:00', '2025-10-09 22:12:00'),
(7, 3, 'fr', 'Sérum Visage Bio Anti-Âge', 'Sérum visage bio premium anti-âge aux ingrédients naturels', 'Sérum visage bio premium anti-âge avec des ingrédients naturels pour une peau radieuse et jeune.', '2025-10-09 22:12:00', '2025-10-09 22:12:00'),
(8, 3, 'en', 'Organic Anti-Aging Face Serum', 'Premium organic anti-aging face serum with natural ingredients', 'Premium organic anti-aging face serum with natural ingredients for radiant and youthful skin.', '2025-10-09 22:12:00', '2025-10-09 22:12:00'),
(9, 3, 'ar', 'مصل الوجه العضوي المضاد للشيخوخة', 'مصل وجه عضوي فاخر مضاد للشيخوخة مع مكونات طبيعية', 'مصل وجه عضوي فاخر مضاد للشيخوخة مع مكونات طبيعية للبشرة المشرقة والشابة.', '2025-10-09 22:12:00', '2025-10-09 22:12:00');

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
(3, 'PTIE3WXG', 1, 15.00, 5, 0, 1, '2025-09-14 12:17:04', NULL),
(6, '17VE9XZY', 20, 10.00, NULL, 0, 1, '2025-09-17 11:05:52', NULL),
(7, 'OZOWHYG8', 20, 10.00, NULL, 0, 1, '2025-09-17 11:05:54', NULL),
(8, '5J0RAEEQ', 20, 10.00, NULL, 0, 1, '2025-09-17 11:05:54', NULL),
(9, '0JKHO9ZZ', 20, 10.00, NULL, 0, 1, '2025-09-17 11:05:54', NULL),
(10, 'VBDRUW9M', 20, 10.00, NULL, 0, 1, '2025-09-17 11:05:54', NULL),
(11, 'HTCX8TGR', 20, 10.00, NULL, 0, 1, '2025-09-17 11:05:54', NULL),
(12, '5IMAC3SI', 20, 10.00, NULL, 0, 1, '2025-09-17 11:05:55', NULL),
(13, 'HCGBKXYM', 20, 10.00, NULL, 0, 1, '2025-09-17 11:06:26', NULL),
(14, 'P2JLGWH0', 24, 10.00, NULL, 0, 1, '2025-09-17 11:18:34', NULL),
(15, 'WTWYGW3L', 25, 10.00, NULL, 0, 1, '2025-09-17 11:18:59', NULL),
(16, 'AL07BXPK', 26, 10.00, NULL, 0, 1, '2025-09-17 11:19:10', NULL),
(17, 'QAMQSI8H', 2, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(18, 'WSVXCDYB', 3, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(19, 'VMA15VNY', 4, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(20, '9IENW1Q1', 5, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(21, 'HY5SDXBU', 6, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(22, 'GTCYBG8P', 10, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(23, '09VQ1A72', 11, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(24, 'YIHUC60D', 12, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(25, '625GN5CX', 13, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(26, '86M43YAL', 14, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(27, 'EPOZQ0U4', 15, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(28, 'TN53XPF7', 16, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(29, '32FPDRNN', 17, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(30, 'PZLWS4EI', 18, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(31, 'F5V0UPUS', 19, 10.00, NULL, 0, 1, '2025-09-17 11:25:57', NULL),
(32, 'H3GC20GH', 30, 10.00, NULL, 0, 1, '2025-10-08 11:45:52', NULL),
(33, 'T5AQHPF6', 31, 10.00, NULL, 0, 1, '2025-10-11 08:38:15', NULL);

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
  `addon_price` decimal(10,2) DEFAULT 0.00,
  `jotform_submission_id` varchar(255) DEFAULT NULL COMMENT 'Stores the Jotform submission ID - full data is fetched from Jotform API when needed',
  `uses_items_table` tinyint(1) DEFAULT 0 COMMENT 'If 1, services are in reservation_items. If 0, using legacy service_id',
  `client_membership_id` int(11) DEFAULT NULL COMMENT 'Link to client membership if used',
  `uses_membership` tinyint(1) DEFAULT 0 COMMENT 'Whether this reservation uses a membership'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Client reservations';

--
-- Déchargement des données de la table `reservations`
--

INSERT INTO `reservations` (`id`, `client_id`, `service_id`, `date_reservation`, `heure_debut`, `heure_fin`, `statut`, `reservation_status`, `prix_service`, `prix_final`, `client_nom`, `client_prenom`, `client_telephone`, `client_email`, `notes_client`, `verification_code`, `verification_token`, `session_id`, `couleurs_choisies`, `date_creation`, `date_modification`, `referral_code_id`, `has_addon`, `addon_service_ids`, `has_healing_addon`, `addon_price`, `jotform_submission_id`, `uses_items_table`, `client_membership_id`, `uses_membership`) VALUES
(5, NULL, 6, '2025-08-23', '15:00:00', '16:05:00', 'en_attente', 'reserved', 130.00, 130.00, 'Frigui', 'Yassine', '22222222', 'friguiyassine750@gmail.com', NULL, '808485', NULL, NULL, NULL, '2025-08-13 21:00:46', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(7, NULL, 6, '2025-08-23', '09:30:00', '10:35:00', 'en_attente', 'reserved', 130.00, 130.00, 'Frigui', 'Yassine', '22222222', 'friguiyassine750@gmail.com', NULL, '455009', NULL, NULL, NULL, '2025-08-13 21:06:38', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(8, NULL, 10, '2025-08-22', '15:30:00', '15:30:00', 'en_attente', 'reserved', 160.00, 160.00, 'Frigui', 'Yassine', '33112233', 'friguiyassine750@gmail.com', '', '218789', NULL, NULL, NULL, '2025-08-13 21:19:53', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(9, 3, 1, '2025-08-25', '10:00:00', '10:10:00', 'en_attente', 'reserved', 40.00, 40.00, 'Test', 'User', '12345678', 'test@example.com', 'Test reservation', '382460', NULL, NULL, NULL, '2025-08-13 21:21:07', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(10, 10, 1, '2025-08-26', '11:00:00', '00:00:00', 'en_attente', 'reserved', 40.00, 40.00, 'Draft', 'User', '87654321', 'draft@example.com', 'Draft test', '533985', NULL, NULL, NULL, '2025-08-13 21:22:02', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(11, 11, 1, '2025-08-27', '14:00:00', '14:10:00', 'en_attente', 'reserved', 40.00, 40.00, 'Email', 'Test', '12345678', 'yassinematoussi42@gmail.com', 'Email test reservation', '221838', '9913d7d7d2f0fce794b1a6d243a6fca69aeb3469b4de9ad8dace312e93597c2f', NULL, NULL, '2025-08-13 21:31:25', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(12, 2, 5, '2025-08-30', '17:00:00', '17:00:00', 'confirmee', 'confirmed', 80.00, 80.00, 'FRIGUI', 'Yassine', '111111111111', 'yassinefrigui9@gmail.com', '', '968720', 'b635c61d30c70282c08fd384b51d609066ea669bb251d9cf662acdcec56e61bd', NULL, NULL, '2025-08-13 21:42:40', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(13, 2, 3, '2025-08-30', '14:30:00', '14:30:00', 'confirmee', 'confirmed', 140.00, 140.00, 'FRIGUI', 'Yassine', '111111111111', 'friguiyassine750@gmail.com', '', '581149', NULL, NULL, NULL, '2025-08-13 21:50:56', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(14, NULL, 4, '2025-07-15', '09:00:00', '09:30:00', 'confirmee', 'draft', 0.00, 0.00, 'Test', 'Test', '55555555', 'tester@gmail.com', '', NULL, NULL, 'booking_1755188649658_6vbexnnekw3', NULL, '2025-08-14 16:24:27', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(15, 13, 11, '2025-09-02', '17:00:00', '17:00:00', 'en_attente', 'reserved', 320.00, 320.00, 'test', 'test', '111111111111', 'test@gmail.com', '', '218622', 'd906ca63cc1df11091e2f73a69c05d5d52166ab70a7e7ffd4b0a6d0ce7275901', NULL, NULL, '2025-08-15 13:36:25', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(16, 15, 5, '2025-08-28', '17:00:00', '17:00:00', 'en_attente', 'reserved', 80.00, 80.00, 'testerr', 'testerr', '99999999', 'testing123456@gmail.com', '', '965742', 'dea6e47e1cb36471f0000ef201d23c946a5dead8da82496f32a9403eb3d24cf4', NULL, NULL, '2025-08-15 14:13:17', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(17, 14, 1, '2025-08-16', '11:00:00', '11:00:00', 'confirmee', 'confirmed', 40.00, 40.00, 'Najjar', 'Sonia', '0021629361740', 'sonyta-n-uk@hotmail.fr', '', '865445', '15bf3e76b2141d73afdd54440e60f2f00cd6c7697535aa2470088912bd5473b8', NULL, NULL, '2025-08-15 15:56:04', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(18, 16, 3, '2025-08-20', '17:00:00', '17:00:00', 'en_attente', 'reserved', 140.00, 140.00, 'test', 'test', '1111111111111', '123@gmail.com', '', '957227', 'c36dc94c84767312642c678c6ab040d3055d1176b03d5cf6058a9904d5e4fe12', NULL, NULL, '2025-08-15 16:03:21', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(19, 17, 3, '2025-08-26', '17:30:00', '17:30:00', 'en_attente', 'reserved', 140.00, 140.00, 'Ziadi', 'Rourou', '52768613', 'rahmaziadi25@gmail.com', '', '204666', '9ee0ea706408e48cbb5c40c11f6785999c29fa4b022e2e409b510313eceec686', NULL, NULL, '2025-08-15 16:29:28', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(20, 5, 9, '2025-08-19', '17:30:00', '17:30:00', 'en_attente', 'reserved', 130.00, 130.00, 'test', 'Yassine', '111111111111', 'testfinal@example.com', '', '668593', '3d43b3ee07c0a2f9c0f571eddf8617af0dfd939bca099cbc0be1b93a8d423bd8', NULL, NULL, '2025-08-15 16:30:51', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(21, 13, 11, '2025-07-15', '09:00:00', '09:30:00', 'en_attente', 'reserved', 320.00, 320.00, 'test', 'Yassine', '22222222222222', 'test@gmail.com', '', '219951', '0d50be28f585b5ebe1edd7ee70861761bb072523fed9f8b5eb2884db131234ec', NULL, NULL, '2025-08-15 16:37:00', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(22, NULL, 8, '2025-08-20', '15:00:00', '15:00:00', 'draft', 'draft', 150.00, 150.00, 'Lamine', 'Sirine', '56280958', 'marcyline1234@yahoo.fr', '', NULL, NULL, 'booking_1755617211646_7zwc091hpxp', NULL, '2025-08-19 15:29:53', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(23, NULL, 2, '2025-07-15', '09:00:00', '09:30:00', 'confirmee', 'draft', 60.00, 60.00, 'Tester', 'Tester', '87654321', 'gester@gmail.com', '', NULL, NULL, 'booking_1755798452972_wthkoqzl3e', NULL, '2025-08-21 17:57:11', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(24, NULL, 4, '2025-07-15', '09:00:00', '09:30:00', 'confirmee', 'draft', 70.00, 70.00, 'Countdown', 'Final', '54325432', 'g@g.com', '', NULL, NULL, 'booking_1755798452972_wthkoqzl3e', NULL, '2025-08-21 17:59:03', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(25, 19, 6, '2025-08-29', '17:30:00', '17:30:00', 'en_attente', 'reserved', 130.00, 130.00, 'Test', 'Test', '12345678', 'sonia.najjar@cgs.com.tn', '', '461814', 'ece98a83d20f011260b4d371f88c64b3a5ee2697c16b1c9a5b4ef71a17e1a56b', NULL, NULL, '2025-08-23 19:09:52', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(26, 12, 6, '2025-08-31', '09:00:00', '09:00:00', 'en_attente', 'reserved', 130.00, 130.00, 'test', 'test', '87654321', 'yassinefrigui9@gmail.com', '', '279200', 'e874aacfeda86a70a1561ac42ba1618fe18b61f7fd0952792ad8471a47886316', NULL, NULL, '2025-08-23 19:11:14', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(27, NULL, 1, '2025-10-16', '16:30:00', '16:30:00', 'draft', 'draft', 0.00, 0.00, 'e', 'e', '123789', 'e@e.com', '', NULL, NULL, 'booking_1759827494768_y4gdxpflyah', NULL, '2025-10-07 08:59:55', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(28, 27, 1, '2025-10-14', '14:00:00', '00:00:00', 'confirmee', 'draft', 0.00, 0.00, NULL, NULL, NULL, NULL, 'Réservation test créée automatiquement avec formulaire JotForm', NULL, NULL, NULL, NULL, '2025-10-07 15:57:28', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, '6356618470817498714', 1, NULL, 0),
(29, 28, 1, '2025-10-14', '14:00:00', '00:00:00', 'confirmee', 'draft', 0.00, 0.00, NULL, NULL, NULL, NULL, 'Réservation test créée automatiquement avec formulaire JotForm', NULL, NULL, NULL, NULL, '2025-10-07 16:05:12', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, '6356623110817368238', 1, NULL, 0),
(30, 29, 1, '2025-10-14', '14:00:00', '00:00:00', 'confirmee', 'draft', 0.00, 0.00, NULL, NULL, NULL, NULL, 'Réservation test créée automatiquement avec formulaire JotForm', NULL, NULL, NULL, NULL, '2025-10-07 16:09:10', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, '6356625490812095586', 1, NULL, 0),
(31, 12, 9, '2026-03-09', '14:00:00', '14:00:00', 'en_attente', 'reserved', 130.00, 130.00, 'FRIGUI', 'Yassine', '22332233', 'yassinefrigui9@gmail.com', '', '873681', 'eeaf8a7e88ff05367945d1d19c3b84938177513eba86645b30be43e581c092aa', NULL, NULL, '2025-10-08 09:04:13', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(32, 30, 11, '2025-10-20', '16:30:00', '16:30:00', 'en_attente', 'reserved', 320.00, 320.00, 'tester', 'tester', '12345873', 'eee@e.com', '', '794171', '9f8668f7f5d75f9d294cfaabb1a0253393fdd02101b2c3e68c96f6ddfc5de955', NULL, NULL, '2025-10-08 11:22:18', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(33, 5, 1, '2025-10-23', '16:00:00', '16:00:00', 'en_attente', 'reserved', 40.00, 40.00, 'test', 'final', '56723121', 'testfinal@example.com', '', '324572', '8810e8838a5bd11d7d2ca1344645b993a3ea7d69e99102762370d15adc20b982', NULL, NULL, '2025-10-08 11:49:22', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(34, 5, 5, '2026-07-02', '10:30:00', '10:30:00', 'en_attente', 'reserved', 80.00, 80.00, 'Tester', 'Jotform', '55669988', 'testfinal@example.com', '', '996706', '040984fa680aed479c8a840e9cb65fb9f4ed445b25685595e05f9e3c7ee16cfb', NULL, NULL, '2025-10-08 14:02:34', '2025-10-10 21:23:20', NULL, 0, NULL, 0, 0.00, NULL, 1, NULL, 0),
(35, NULL, 23, '2025-10-25', '15:30:00', '15:30:00', 'draft', 'draft', 0.00, 0.00, 'FRIGUI', 'Yassine', '67875462', 'yassinefrigui9@gmail.com', '', NULL, NULL, 'booking_1760129211018_xcphyxyipl', NULL, '2025-10-10 21:40:51', '2025-10-10 21:52:20', NULL, 0, NULL, 0, 0.00, NULL, 0, NULL, 0);

--
-- Déclencheurs `reservations`
--
DELIMITER $$
CREATE TRIGGER `trg_membership_refund_on_cancel` AFTER UPDATE ON `reservations` FOR EACH ROW BEGIN
    -- Only trigger when reservation is cancelled and previously used a membership
    IF NEW.statut = 'annulé' 
       AND OLD.statut != 'annulé' 
       AND NEW.uses_membership = 1 
       AND NEW.client_membership_id IS NOT NULL THEN
        
        -- Restore membership usage
        UPDATE client_memberships 
        SET services_utilises = services_utilises - 1,
            services_restants = services_restants + 1
        WHERE id = NEW.client_membership_id
        AND services_restants < services_total; -- Don't exceed total
        
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_membership_usage_on_confirm` AFTER UPDATE ON `reservations` FOR EACH ROW BEGIN
    -- Only trigger when reservation is newly confirmed and uses a membership
    IF NEW.statut = 'confirmé' 
       AND OLD.statut != 'confirmé' 
       AND NEW.uses_membership = 1 
       AND NEW.client_membership_id IS NOT NULL THEN
        
        -- Update membership usage
        UPDATE client_memberships 
        SET services_utilises = services_utilises + 1,
            services_restants = services_restants - 1
        WHERE id = NEW.client_membership_id;
        
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `reservations_with_services`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `reservations_with_services` (
`id` int(11)
,`client_id` int(11)
,`service_id` int(11)
,`date_reservation` date
,`heure_debut` time
,`heure_fin` time
,`statut` enum('en_attente','confirmee','en_cours','terminee','annulee','no_show','draft')
,`reservation_status` enum('draft','reserved','confirmed','cancelled')
,`prix_service` decimal(10,2)
,`prix_final` decimal(10,2)
,`client_nom` varchar(100)
,`client_prenom` varchar(100)
,`client_telephone` varchar(20)
,`client_email` varchar(255)
,`notes_client` text
,`verification_code` varchar(6)
,`verification_token` varchar(64)
,`session_id` varchar(100)
,`couleurs_choisies` text
,`date_creation` timestamp
,`date_modification` timestamp
,`referral_code_id` int(11)
,`has_addon` tinyint(1)
,`addon_service_ids` text
,`has_healing_addon` tinyint(1)
,`addon_price` decimal(10,2)
,`jotform_submission_id` varchar(255)
,`uses_items_table` tinyint(1)
,`primary_service_id` int(11)
,`service_count` bigint(21)
,`calculated_total` decimal(32,2)
);

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

--
-- Déchargement des données de la table `reservation_items`
--

INSERT INTO `reservation_items` (`id`, `reservation_id`, `service_id`, `item_type`, `prix`, `notes`) VALUES
(1, 5, 6, 'main', 130.00, NULL),
(2, 7, 6, 'main', 130.00, NULL),
(3, 8, 10, 'main', 160.00, NULL),
(4, 9, 1, 'main', 40.00, NULL),
(5, 10, 1, 'main', 40.00, NULL),
(6, 11, 1, 'main', 40.00, NULL),
(7, 12, 5, 'main', 80.00, NULL),
(8, 13, 3, 'main', 140.00, NULL),
(9, 14, 4, 'main', 0.00, NULL),
(10, 15, 11, 'main', 320.00, NULL),
(11, 16, 5, 'main', 80.00, NULL),
(12, 17, 1, 'main', 40.00, NULL),
(13, 18, 3, 'main', 140.00, NULL),
(14, 19, 3, 'main', 140.00, NULL),
(15, 20, 9, 'main', 130.00, NULL),
(16, 21, 11, 'main', 320.00, NULL),
(17, 22, 8, 'main', 150.00, NULL),
(18, 23, 2, 'main', 60.00, NULL),
(19, 24, 4, 'main', 70.00, NULL),
(20, 25, 6, 'main', 130.00, NULL),
(21, 26, 6, 'main', 130.00, NULL),
(22, 27, 1, 'main', 0.00, NULL),
(23, 28, 1, 'main', 0.00, NULL),
(24, 29, 1, 'main', 0.00, NULL),
(25, 30, 1, 'main', 0.00, NULL),
(26, 31, 9, 'main', 130.00, NULL),
(27, 32, 11, 'main', 320.00, NULL),
(28, 33, 1, 'main', 40.00, NULL),
(29, 34, 5, 'main', 80.00, NULL);

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
(7, 'Healing Add-On', 'Enhancement add-on for V-Steam and Vajacial services', NULL, 'addon', NULL, 1, 30.00, 0, NULL, 'thé aux herbes personnalisé, conseils de style de vie', NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 1, '2025-07-17 13:10:32'),
(8, 'avec épilation', 'Vajacial réparateur avec service d\'épilation inclus', NULL, 'variant', 6, 2, 150.00, 65, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 1, '2025-07-17 13:10:32'),
(9, 'sans épilation', 'Vajacial réparateur sans épilation', NULL, 'variant', 6, 2, 130.00, 65, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 2, '2025-07-17 13:10:32'),
(10, 'Pack 5 séances - Relaxation Steam', 'Package de 5 sessions', NULL, 'package', 1, 1, 160.00, 10, NULL, NULL, NULL, NULL, 5, 32.00, 365, 1, 0, 0, 1, '2025-07-17 13:10:32'),
(11, 'Pack 10 séances - Relaxation Steam', 'Package de 10 sessions', NULL, 'package', 1, 1, 320.00, 10, NULL, NULL, NULL, NULL, 10, 32.00, 365, 1, 0, 0, 2, '2025-07-17 13:10:32'),
(12, 'Pack 5 séances - Specialized Steam 10min', 'Package de 5 sessions', NULL, 'package', 2, 1, 240.00, 10, NULL, NULL, NULL, NULL, 5, 48.00, 365, 1, 0, 0, 1, '2025-07-17 13:10:32'),
(13, 'Pack 10 séances - Specialized Steam 10min', 'Package de 10 sessions', NULL, 'package', 2, 1, 480.00, 10, NULL, NULL, NULL, NULL, 10, 48.00, 365, 1, 0, 0, 2, '2025-07-17 13:10:32'),
(14, 'Massage Pieds et Dos (10 min)', 'Massage relaxant des pieds et du dos avec machines sp??cialis??es', 'Massage cibl?? de 10 minutes pour d??tendre les pieds et le dos', 'base', NULL, 3, 20.00, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 1, '2025-10-10 20:46:00'),
(15, 'Massage Pieds et Dos (20 min)', 'Massage relaxant prolong?? des pieds et du dos', 'Massage approfondi de 20 minutes pour une relaxation optimale', 'base', NULL, 3, 30.00, 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 2, '2025-10-10 20:46:00'),
(16, 'Massage Pieds et Dos (30 min)', 'Massage complet des pieds et du dos', 'Session compl??te de 30 minutes pour une d??tente profonde', 'base', NULL, 3, 40.00, 30, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 3, '2025-10-10 20:46:00'),
(17, 'Massage des Yeux (10 min)', 'Massage doux et relaxant du contour des yeux', 'Soin sp??cialis?? pour r??duire la fatigue oculaire et d??tendre', 'base', NULL, 3, 25.00, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 4, '2025-10-10 20:46:00'),
(18, 'Massage des Yeux (15 min)', 'Massage prolong?? du contour des yeux', 'Soin approfondi pour une relaxation maximale du contour des yeux', 'base', NULL, 3, 30.00, 15, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 5, '2025-10-10 20:46:00'),
(19, 'Rituel D??couverte (45 min)', 'D??tox botanique du cuir chevelu avec produits La Biosthetique', 'Rituel d??couverte de 45 minutes incluant nettoyage, massage et traitement du cuir chevelu', 'base', NULL, 5, 140.00, 45, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 1, 1, '2025-10-10 20:46:00'),
(20, 'Rituel Classique (60 min)', 'Soin complet du cuir chevelu avec massage relaxant', 'Rituel classique de 60 minutes pour une exp??rience spa capillaire compl??te', 'base', NULL, 5, 180.00, 60, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, 1, 2, '2025-10-10 20:46:00'),
(21, 'Rituel Deluxe (90 min)', 'Exp??rience spa capillaire ultime avec soins premium', 'Rituel deluxe de 90 minutes incluant tous les traitements premium', 'base', NULL, 5, 250.00, 90, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, 1, 3, '2025-10-10 20:46:00'),
(22, '??pilation Br??silienne', '??pilation compl??te ?? la cire br??silienne', 'Service d\'??pilation br??silienne professionnel pour une peau douce et lisse', 'base', NULL, 6, 80.00, 45, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 1, '2025-10-10 20:46:00'),
(23, 'Steam & Eyes Reset', '10min Relaxation Steam + 10min Eye Massage + complimentary tea', NULL, 'base', NULL, 4, 55.00, 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 1, '2025-10-10 21:01:21'),
(24, 'Feet Retreat', '10min Relaxation Steam + 10min Foot Massage (machine) + tea', NULL, 'base', NULL, 4, 70.00, 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 2, '2025-10-10 21:01:21'),
(25, 'Quick Glow Duo', '10min Relaxation Steam + 10min Face Massage + tea', NULL, 'base', NULL, 4, 45.00, 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 3, '2025-10-10 21:01:21'),
(26, 'Full Relax Reset', '10min Relaxation Steam + 10min Eye Massage + 10min Foot Massage + tea', NULL, 'base', NULL, 4, 85.00, 30, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 4, '2025-10-10 21:01:21'),
(27, 'Steam & Aromatherapy Head Ritual', '10min Relaxation Steam + 15min Aromatherapy Head Massage (with essential oil) + tea', NULL, 'base', NULL, 4, 115.00, 25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 5, '2025-10-10 21:01:21'),
(28, 'Steam & Reflexology Ritual', '10min Relaxation Steam + 20min Foot Reflexology + tea', NULL, 'base', NULL, 4, 110.00, 30, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 6, '2025-10-10 21:01:21'),
(29, 'Womb & Mind Ritual', '30min Relaxation Steam + 45min Japanese Head Spa (Discovery Ritual) + tea', NULL, 'base', NULL, 4, 230.00, 75, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 7, '2025-10-10 21:01:22'),
(30, 'Tranquility for Two', 'Each: 30min Relaxation Steam + 10min choice of Eye or Foot Massage + tea (120 TND per person)', NULL, 'base', NULL, 4, 240.00, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 8, '2025-10-10 21:01:22'),
(31, 'Contraindication Option', '10min Relaxation Steam + 10min Eye Massage + tea (when longer steam contraindicated)', NULL, 'base', NULL, 4, 55.00, 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 9, '2025-10-10 21:01:22'),
(32, 'ZenMama Pregnancy Ritual', '30min steam-free: pressure-point Head Massage with pregnancy-safe essential oil + Feet Massage + Eye Massage + tea', NULL, 'base', NULL, 4, 95.00, 30, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 10, '2025-10-10 21:01:22'),
(53, 'Package Massage Complet', 'Massage pieds, dos et yeux complet (30 min pieds+dos + 15 min yeux)', NULL, 'base', NULL, 3, 65.00, 45, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 6, '2025-10-10 21:56:12'),
(54, 'Massage Pieds (Seul) - 10 min', 'Massage r??flexologie des pieds uniquement', NULL, 'base', NULL, 3, 15.00, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 7, '2025-10-10 21:56:12'),
(55, '??pilation Br??silienne', 'Service d\'??pilation br??silienne professionnelle', NULL, 'base', NULL, 6, 80.00, 45, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 1, '2025-10-10 21:56:12');

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
(41, 13, 'ar', 'باقة 10 جلسات - البخار المتخصص 10 دقائق', 'باقة 10 جلسات', NULL, NULL, NULL, NULL, '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(42, 14, 'fr', 'Massage Pieds et Dos (10 min)', 'Massage relaxant des pieds et du dos avec machines sp??cialis??es', 'Massage cibl?? de 10 minutes pour d??tendre les pieds et le dos utilisant des ??quipements professionnels', NULL, 'Non recommand?? en cas de blessures r??centes ou d\'inflammations', 'Boire beaucoup d\'eau apr??s le massage', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(43, 15, 'fr', 'Massage Pieds et Dos (20 min)', 'Massage relaxant prolong?? des pieds et du dos', 'Massage approfondi de 20 minutes pour une relaxation optimale des pieds et du dos', NULL, 'Non recommand?? en cas de blessures r??centes ou d\'inflammations', 'Boire beaucoup d\'eau et se reposer apr??s le massage', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(44, 16, 'fr', 'Massage Pieds et Dos (30 min)', 'Massage complet des pieds et du dos', 'Session compl??te de 30 minutes pour une d??tente profonde et durable', NULL, 'Non recommand?? en cas de blessures r??centes ou d\'inflammations', 'Boire beaucoup d\'eau et ??viter les activit??s intenses', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(45, 17, 'fr', 'Massage des Yeux (10 min)', 'Massage doux et relaxant du contour des yeux', 'Soin sp??cialis?? de 10 minutes pour r??duire la fatigue oculaire et les tensions', NULL, 'Non recommand?? en cas d\'infection oculaire ou de chirurgie r??cente', '??viter de se frotter les yeux apr??s le massage', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(46, 18, 'fr', 'Massage des Yeux (15 min)', 'Massage prolong?? du contour des yeux', 'Soin approfondi de 15 minutes pour une relaxation maximale du contour des yeux', NULL, 'Non recommand?? en cas d\'infection oculaire ou de chirurgie r??cente', '??viter de se frotter les yeux et appliquer une compresse fra??che si besoin', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(47, 19, 'fr', 'Rituel D??couverte (45 min)', 'D??tox botanique du cuir chevelu avec produits La Biosthetique', 'Rituel d??couverte de 45 minutes incluant analyse du cuir chevelu, nettoyage profond, massage relaxant et traitement personnalis??', 'Analyse capillaire, produits premium La Biosthetique, th?? offert', 'Non recommand?? en cas de l??sions ou irritations du cuir chevelu', 'Ne pas laver les cheveux pendant 24h pour maximiser les bienfaits', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(48, 20, 'fr', 'Rituel Classique (60 min)', 'Soin complet du cuir chevelu avec massage relaxant prolong??', 'Rituel classique de 60 minutes offrant une exp??rience spa capillaire compl??te avec massage ??tendu des ??paules et nuque', 'Analyse capillaire, massage ??tendu, produits premium La Biosthetique, th?? et collation', 'Non recommand?? en cas de l??sions ou irritations du cuir chevelu', 'Ne pas laver les cheveux pendant 24-48h, ??viter les produits coiffants', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(49, 21, 'fr', 'Rituel Deluxe (90 min)', 'Exp??rience spa capillaire ultime avec tous les soins premium', 'Rituel deluxe de 90 minutes incluant tous les traitements premium, massage complet de la t??te, ??paules et nuque, et soins intensifs', 'Analyse approfondie, massage complet, masque premium, produits La Biosthetique, th?? et collation premium', 'Non recommand?? en cas de l??sions ou irritations du cuir chevelu', 'Ne pas laver les cheveux pendant 48h, utiliser uniquement des produits recommand??s', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(50, 22, 'fr', '??pilation Br??silienne', '??pilation compl??te ?? la cire br??silienne', 'Service d\'??pilation br??silienne professionnel utilisant de la cire de qualit?? sup??rieure pour une peau douce et lisse', 'Pr??paration de la peau, cire premium, soin apaisant post-??pilation', 'Non recommand?? pendant la grossesse, sur peau irrit??e ou br??l??e par le soleil', '??viter l\'exposition au soleil, les bains chauds et les v??tements serr??s pendant 24h', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(51, 14, 'en', 'Feet and Back Massage (10 min)', 'Relaxing feet and back massage with specialized machines', 'Targeted 10-minute massage to relax feet and back using professional equipment', NULL, 'Not recommended in case of recent injuries or inflammations', 'Drink plenty of water after the massage', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(52, 15, 'en', 'Feet and Back Massage (20 min)', 'Extended relaxing feet and back massage', 'Deep 20-minute massage for optimal relaxation of feet and back', NULL, 'Not recommended in case of recent injuries or inflammations', 'Drink plenty of water and rest after the massage', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(53, 16, 'en', 'Feet and Back Massage (30 min)', 'Complete feet and back massage', 'Full 30-minute session for deep and lasting relaxation', NULL, 'Not recommended in case of recent injuries or inflammations', 'Drink plenty of water and avoid intense activities', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(54, 17, 'en', 'Eye Massage (10 min)', 'Gentle and relaxing eye area massage', 'Specialized 10-minute treatment to reduce eye fatigue and tension', NULL, 'Not recommended in case of eye infection or recent surgery', 'Avoid rubbing eyes after the massage', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(55, 18, 'en', 'Eye Massage (15 min)', 'Extended eye area massage', 'Deep 15-minute treatment for maximum relaxation of the eye area', NULL, 'Not recommended in case of eye infection or recent surgery', 'Avoid rubbing eyes and apply a cool compress if needed', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(56, 19, 'en', 'Discovery Ritual (45 min)', 'Botanical scalp detox with La Biosthetique products', '45-minute discovery ritual including scalp analysis, deep cleansing, relaxing massage and personalized treatment', 'Scalp analysis, premium La Biosthetique products, complimentary tea', 'Not recommended in case of scalp lesions or irritations', 'Do not wash hair for 24h to maximize benefits', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(57, 20, 'en', 'Classic Ritual (60 min)', 'Complete scalp treatment with extended relaxing massage', '60-minute classic ritual offering a complete hair spa experience with extended shoulder and neck massage', 'Scalp analysis, extended massage, premium La Biosthetique products, tea and snack', 'Not recommended in case of scalp lesions or irritations', 'Do not wash hair for 24-48h, avoid styling products', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(58, 21, 'en', 'Deluxe Ritual (90 min)', 'Ultimate hair spa experience with all premium treatments', '90-minute deluxe ritual including all premium treatments, complete head, shoulder and neck massage, and intensive care', 'In-depth analysis, complete massage, premium mask, La Biosthetique products, premium tea and snack', 'Not recommended in case of scalp lesions or irritations', 'Do not wash hair for 48h, use only recommended products', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(59, 22, 'en', 'Brazilian Wax', 'Complete Brazilian waxing service', 'Professional Brazilian waxing service using premium quality wax for smooth and silky skin', 'Skin preparation, premium wax, post-waxing soothing treatment', 'Not recommended during pregnancy, on irritated or sunburned skin', 'Avoid sun exposure, hot baths and tight clothing for 24h', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(60, 14, 'ar', '?????????? ?????????????? ???????????? (10 ??????????)', '?????????? ???????? ?????????????? ???????????? ???????????????? ?????????? ????????????', '?????????? ???????????? ???????? 10 ?????????? ???????????? ?????????????? ???????????? ???????????????? ?????????? ????????????????', NULL, '?????? ???????? ???? ???? ???????? ???????????????? ?????????????? ???? ????????????????????', '?????? ???????????? ???? ?????????? ?????? ??????????????', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(61, 15, 'ar', '?????????? ?????????????? ???????????? (20 ??????????)', '?????????? ???????? ???????? ?????????????? ????????????', '?????????? ???????? ???????? 20 ?????????? ?????????????????? ???????????? ?????????????? ????????????', NULL, '?????? ???????? ???? ???? ???????? ???????????????? ?????????????? ???? ????????????????????', '?????? ???????????? ???? ?????????? ?????????????? ?????? ??????????????', '2025-10-10 20:46:00', '2025-10-10 20:46:00'),
(62, 16, 'ar', '?????????? ?????????????? ???????????? (30 ??????????)', '?????????? ???????? ?????????????? ????????????', '???????? ?????????? ???????? 30 ?????????? ?????????????????? ???????????? ??????????????', NULL, '?????? ???????? ???? ???? ???????? ???????????????? ?????????????? ???? ????????????????????', '?????? ???????????? ???? ?????????? ?????????? ?????????????? ??????????????', '2025-10-10 20:46:01', '2025-10-10 20:46:01'),
(63, 17, 'ar', '?????????? ???????????? (10 ??????????)', '?????????? ???????? ?????????? ?????????? ??????????', '???????? ?????????? ???????? 10 ?????????? ???????????? ?????????? ?????????? ??????????????', NULL, '?????? ???????? ???? ???? ???????? ???????? ?????????? ???? ?????????????? ??????????????', '???????? ?????? ?????????????? ?????? ??????????????', '2025-10-10 20:46:01', '2025-10-10 20:46:01'),
(64, 18, 'ar', '?????????? ???????????? (15 ??????????)', '?????????? ???????? ?????????? ??????????', '???????? ???????? ???????? 15 ?????????? ?????????????????? ???????????? ?????????? ??????????', NULL, '?????? ???????? ???? ???? ???????? ???????? ?????????? ???? ?????????????? ??????????????', '???????? ?????? ?????????????? ?????? ???????????? ?????????? ?????? ?????? ??????????', '2025-10-10 20:46:01', '2025-10-10 20:46:01'),
(65, 19, 'ar', '?????? ???????????????? (45 ??????????)', '?????????? ???????????? ?????????? ?????????? ?????????????? ???? ??????????????????', '?????? ???????????? ???????? 45 ?????????? ???????? ?????????? ???????? ?????????? ???????????????? ???????????? ???????????????? ???????????? ?????????????? ????????????', '?????????? ???????? ???????????? ???????????? ???? ?????????????????? ???????????????? ?????? ??????????', '?????? ???????? ???? ???? ???????? ???????? ???????? ???? ???????? ???? ???????? ??????????', '?????? ?????? ?????????? ???????? 24 ???????? ???????????? ???????? ??????????', '2025-10-10 20:46:01', '2025-10-10 20:46:01'),
(66, 20, 'ar', '?????????? ?????????????????? (60 ??????????)', '???????? ???????? ?????????? ?????????? ???? ?????????? ???????? ????????', '?????? ?????????????? ???????? 60 ?????????? ???????? ?????????? ?????? ?????? ?????????? ???? ?????????? ???????? ?????????????? ??????????????', '?????????? ???????? ???????????? ?????????? ?????????? ???????????? ???? ?????????????????? ???????????????? ?????? ?????????? ??????????', '?????? ???????? ???? ???? ???????? ???????? ???????? ???? ???????? ???? ???????? ??????????', '?????? ?????? ?????????? ???????? 24-48 ?????????? ???????? ???????????? ??????????????', '2025-10-10 20:46:01', '2025-10-10 20:46:01'),
(67, 21, 'ar', '?????????? ???????????? (90 ??????????)', '?????????? ?????? ?????? ???????????? ???? ???????? ???????????????? ??????????????', '?????? ???????? ???????? 90 ?????????? ???????? ???????? ???????????????? ???????????????? ?????????? ???????? ?????????? ???????????????? ???????????????? ???????????? ??????????', '?????????? ???????????? ?????????? ?????????? ???????? ?????????? ???????????? ???? ???????????????????? ?????? ?????????? ?????????? ??????????', '?????? ???????? ???? ???? ???????? ???????? ???????? ???? ???????? ???? ???????? ??????????', '?????? ?????? ?????????? ???????? 48 ?????????? ?????????????? ???????????????? ???????????? ?????? ??????', '2025-10-10 20:46:01', '2025-10-10 20:46:01'),
(68, 22, 'ar', '?????????? ?????????? ????????????????????', '???????? ?????????? ?????????? ???????????????????? ??????????????', '???????? ?????????? ?????????? ???????????????????? ???????????????????? ???????????????? ?????? ???????? ???????????? ???????????? ?????? ???????? ?????????? ??????????????', '?????????? ?????????????? ?????? ?????????? ???????? ???????? ?????? ?????????? ??????????', '?????? ???????? ???? ?????????? ???????????? ?????? ???????????? ???????????????? ???? ???????????????? ???? ??????????', '???????? ???????????? ?????????? ?????????????????? ?????????????? ???????????????? ???????????? ???????? 24 ????????', '2025-10-10 20:46:01', '2025-10-10 20:46:01'),
(99, 23, 'fr', 'Steam & Eyes Reset', '10min de vapeur relaxante + 10min de massage des yeux + th?? offert', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(100, 24, 'fr', 'Feet Retreat', '10min de vapeur relaxante + 10min de massage des pieds (machine) + th??', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(101, 25, 'fr', 'Quick Glow Duo', '10min de vapeur relaxante + 10min de massage du visage + th??', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(102, 26, 'fr', 'Full Relax Reset', '10min de vapeur + 10min massage des yeux + 10min massage des pieds + th??', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(103, 27, 'fr', 'Steam & Aromatherapy Head Ritual', '10min de vapeur + 15min massage cr??nien aromath??rapie (huile essentielle) + th??', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(104, 28, 'fr', 'Steam & Reflexology Ritual', '10min de vapeur relaxante + 20min de r??flexologie plantaire + th??', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(105, 29, 'fr', 'Womb & Mind Ritual', '30min de vapeur relaxante + 45min Spa Capillaire Japonais (Rituel D??couverte) + th??', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(106, 30, 'fr', 'Tranquility for Two', 'Chacune : 30min de vapeur + 10min au choix (yeux ou pieds) + th?? (120 TND par personne)', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(107, 31, 'fr', 'Option Contre-indication', '10min de vapeur + 10min massage des yeux + th?? (quand vapeur prolong??e contre-indiqu??e)', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(108, 32, 'fr', 'Rituel ZenMama Grossesse', '30min sans vapeur : massage cr??nien aux points de pression + massage des pieds + massage des yeux + th??', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(109, 23, 'en', 'Steam & Eyes Reset', '10min Relaxation Steam + 10min Eye Massage + complimentary tea', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(110, 24, 'en', 'Feet Retreat', '10min Relaxation Steam + 10min Foot Massage (machine) + tea', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(111, 25, 'en', 'Quick Glow Duo', '10min Relaxation Steam + 10min Face Massage + tea', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(112, 26, 'en', 'Full Relax Reset', '10min Relaxation Steam + 10min Eye Massage + 10min Foot Massage + tea', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(113, 27, 'en', 'Steam & Aromatherapy Head Ritual', '10min Relaxation Steam + 15min Aromatherapy Head Massage (essential oil) + tea', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(114, 28, 'en', 'Steam & Reflexology Ritual', '10min Relaxation Steam + 20min Foot Reflexology + tea', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(115, 29, 'en', 'Womb & Mind Ritual', '30min Relaxation Steam + 45min Japanese Head Spa (Discovery Ritual) + tea', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(116, 30, 'en', 'Tranquility for Two', 'Each: 30min Relaxation Steam + 10min choice of Eye or Foot Massage + tea (120 TND per person)', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(117, 31, 'en', 'Contraindication Option', '10min Relaxation Steam + 10min Eye Massage + tea (when longer steam contraindicated)', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(118, 32, 'en', 'ZenMama Pregnancy Ritual', '30min steam-free: pressure-point Head Massage + Feet Massage + Eye Massage + tea', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(119, 23, 'ar', '?????????? ???????????? ??????????????', '10 ?????????? ???????? ?????????????? + 10 ?????????? ?????????? ?????????? + ?????? ??????????', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(120, 24, 'ar', '???????? ??????????????', '10 ?????????? ???????? ?????????????? + 10 ?????????? ?????????? ?????????????? (??????) + ??????', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(121, 25, 'ar', '?????????? ???????????? ????????????', '10 ?????????? ???????? ?????????????? + 10 ?????????? ?????????? ?????????? + ??????', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(122, 26, 'ar', '?????????? ?????? ?????????????????? ????????????', '10 ?????????? ???????? + 10 ?????????? ?????????? ?????????? + 10 ?????????? ?????????? ?????????????? + ??????', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(123, 27, 'ar', '???????? ???????????? ?????????????? ????????????????', '10 ?????????? ???????? + 15 ?????????? ?????????? ?????????? ???????????????? (?????? ????????) + ??????', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(124, 28, 'ar', '???????? ???????????? ???????? ??????????????????', '10 ?????????? ???????? ?????????????? + 20 ?????????? ?????? ???????????????? ?????????? + ??????', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(125, 29, 'ar', '???????? ?????????? ????????????', '30 ?????????? ???????? ?????????????? + 45 ?????????? ?????? ?????????? ???????????????? (???????? ????????????????) + ??????', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(126, 30, 'ar', '???????????? ????????????', '??????: 30 ?????????? ???????? ?????????????? + 10 ?????????? ???????????? ?????????? ?????????? ???? ?????????? + ?????? (120 ?????????? ??????????)', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(127, 31, 'ar', '???????? ?????????? ??????????????????', '10 ?????????? ???????? + 10 ?????????? ?????????? ?????????? + ?????? (?????? ?????????? ???????????? ????????????)', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(128, 32, 'ar', '???????? ?????? ???????? ??????????', '30 ?????????? ???????? ????????: ?????????? ?????????? ?????????? ?????????? + ?????????? ?????????????? + ?????????? ?????????? + ??????', NULL, NULL, NULL, NULL, '2025-10-10 21:12:39', '2025-10-10 21:12:39'),
(129, 53, 'fr', 'Package Massage Complet', 'Massage pieds, dos et yeux complet (30 min pieds+dos + 15 min yeux)', NULL, 'huiles essentielles, serviettes chaudes', NULL, NULL, '2025-10-10 21:56:12', '2025-10-10 21:56:12'),
(130, 54, 'fr', 'Massage Pieds (Seul) - 10 min', 'Massage r??flexologie des pieds uniquement', NULL, 'huiles essentielles', NULL, NULL, '2025-10-10 21:56:12', '2025-10-10 21:56:12'),
(131, 53, 'en', 'Full Massage Package', 'Complete feet, back and eyes massage (30 min feet+back + 15 min eyes)', NULL, 'essential oils, hot towels', NULL, NULL, '2025-10-10 21:56:12', '2025-10-10 21:56:12'),
(132, 54, 'en', 'Feet Massage Only - 10 min', 'Reflexology foot massage only', NULL, 'essential oils', NULL, NULL, '2025-10-10 21:56:12', '2025-10-10 21:56:12'),
(133, 53, 'ar', '???????? ?????????????? ??????????????', '?????????? ???????? ?????????????? ???????????? ???????????????? (30 ?????????? ??????????+?????? + 15 ?????????? ????????)', NULL, '???????? ???????????? ?????????? ??????????', NULL, NULL, '2025-10-10 21:56:12', '2025-10-10 21:56:12'),
(134, 54, 'ar', '?????????? ?????????????? ?????? - 10 ??????????', '?????????? ?????????????? ?????????????? ??????', NULL, '???????? ??????????', NULL, NULL, '2025-10-10 21:56:12', '2025-10-10 21:56:12');

-- --------------------------------------------------------

--
-- Structure de la table `store_orders`
--

CREATE TABLE `store_orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(20) NOT NULL,
  `session_id` varchar(100) DEFAULT NULL COMMENT 'Session ID for draft orders',
  `client_id` int(11) DEFAULT NULL,
  `client_name` varchar(200) NOT NULL,
  `client_email` varchar(255) NOT NULL,
  `client_phone` varchar(20) NOT NULL,
  `client_address` text NOT NULL,
  `status` enum('draft','pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  `items_count` int(11) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `order_data` text DEFAULT NULL COMMENT 'JSON data for draft orders containing cart items and form data'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `store_orders`
--

INSERT INTO `store_orders` (`id`, `order_number`, `session_id`, `client_id`, `client_name`, `client_email`, `client_phone`, `client_address`, `status`, `total_amount`, `items_count`, `notes`, `admin_notes`, `created_at`, `updated_at`, `confirmed_at`, `shipped_at`, `delivered_at`, `order_data`) VALUES
(1, 'ZS-20250916-0001', NULL, NULL, 'Test Customer', 'test@example.com', '1234567890', '123 Test Street', 'pending', 59.98, 2, NULL, NULL, '2025-09-16 17:20:35', '2025-09-16 17:33:19', NULL, NULL, NULL, NULL),
(6, 'ZS-20250916-0002', NULL, NULL, 'e e', 'e@e.e', '11111111', 'eeee, eee 10', 'pending', 7400.00, 4, '', NULL, '2025-09-16 18:16:22', '2025-09-16 18:16:22', NULL, NULL, NULL, NULL),
(7, 'ZS-20250916-0003', NULL, NULL, 'e e', 'e@e.e', '11111111', 'eeee, eee 10', 'pending', 7400.00, 4, '', NULL, '2025-09-16 18:24:31', '2025-09-16 18:24:31', NULL, NULL, NULL, NULL),
(8, 'ZS-20250916-0004', NULL, NULL, 'e e', 'e@e.e', '11111111', 'eeee, eee 10', 'pending', 7400.00, 4, '', NULL, '2025-09-16 18:32:13', '2025-09-16 18:32:13', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `store_order_items`
--

CREATE TABLE `store_order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `product_description` text DEFAULT NULL,
  `product_price` decimal(10,2) NOT NULL,
  `product_image_url` varchar(500) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `store_order_items`
--

INSERT INTO `store_order_items` (`id`, `order_id`, `product_id`, `product_name`, `product_description`, `product_price`, `product_image_url`, `quantity`, `subtotal`, `created_at`) VALUES
(1, 1, 1, 'Chaise de Spa Luxe ZS001', 'Chaise de spa professionnelle avec fonction massage', 29.99, '/images/products/spa-chair-001.jpg', 2, 59.98, '2025-09-16 17:20:35'),
(5, 6, 2, 'Lit de Soins du Visage Professionnel', 'Lit ajustable pour soins du visage avec coussin mémoire de forme', 1200.00, '/images/products/facial-bed-002.jpg', 2, 2400.00, '2025-09-16 18:16:22'),
(6, 6, 1, 'Chaise de Spa Luxe ZS001', 'Chaise de spa professionnelle avec fonction massage', 2500.00, '/images/products/spa-chair-001.jpg', 2, 5000.00, '2025-09-16 18:16:22'),
(7, 7, 2, 'Lit de Soins du Visage Professionnel', 'Lit ajustable pour soins du visage avec coussin mémoire de forme', 1200.00, '/images/products/facial-bed-002.jpg', 2, 2400.00, '2025-09-16 18:24:31'),
(8, 7, 1, 'Chaise de Spa Luxe ZS001', 'Chaise de spa professionnelle avec fonction massage', 2500.00, '/images/products/spa-chair-001.jpg', 2, 5000.00, '2025-09-16 18:24:31'),
(9, 8, 2, 'Lit de Soins du Visage Professionnel', 'Lit ajustable pour soins du visage avec coussin mémoire de forme', 1200.00, '/images/products/facial-bed-002.jpg', 2, 2400.00, '2025-09-16 18:32:13'),
(10, 8, 1, 'Chaise de Spa Luxe ZS001', 'Chaise de spa professionnelle avec fonction massage', 2500.00, '/images/products/spa-chair-001.jpg', 2, 5000.00, '2025-09-16 18:32:13');

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
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of allowed admin pages for employees' CHECK (json_valid(`permissions`)),
  `actif` tinyint(1) DEFAULT 1,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `nom`, `email`, `mot_de_passe`, `role`, `permissions`, `actif`, `date_creation`) VALUES
(1, 'Admin ZenShe', 'admin@zenshe.ca', '$2b$12$99EmaZpNDQ7Vtl1Caf6L0.FA77GKku5EGkRokwFl3dSwq/bGyUoDm', 'super_admin', NULL, 1, '2025-07-17 13:10:32'),
(2, 'Super Admin', 'superadmin@zenshe.spa', '$2b$12$zYpGCtCAvSmYGZyo0zMaVuSsktNrkJtmjpVQV/pMmtEF9PMYH4HF.', 'super_admin', NULL, 1, '2025-09-17 10:10:28');

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_active_client_memberships`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_active_client_memberships` (
`client_membership_id` int(11)
,`client_id` int(11)
,`client_prenom` varchar(100)
,`client_nom` varchar(100)
,`client_email` varchar(255)
,`membership_id` int(11)
,`membership_nom` varchar(100)
,`date_debut` date
,`date_fin` date
,`statut` enum('active','expired','cancelled','pending')
,`services_total` int(11)
,`services_utilises` int(11)
,`services_restants` int(11)
,`montant_paye` decimal(10,2)
,`mode_paiement` enum('cash','card','bank_transfer','online')
,`duree_engagement` int(11)
,`jours_restants` int(7)
,`status_detail` varchar(13)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_pending_scheduled_memberships`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_pending_scheduled_memberships` (
`id` int(11)
,`client_id` int(11)
,`client_prenom` varchar(100)
,`client_nom` varchar(100)
,`client_email` varchar(255)
,`membership_id` int(11)
,`membership_nom` varchar(100)
,`services_par_mois` int(11)
,`duree_mois` int(11)
,`montant_prevu` decimal(10,2)
,`statut` enum('active','expired','cancelled','pending')
,`notes` text
,`date_scheduled` timestamp
,`date_activated` datetime
,`date_cancelled` datetime
,`activated_by` int(11)
);

-- --------------------------------------------------------

--
-- Structure de la vue `reservations_with_services`
--
DROP TABLE IF EXISTS `reservations_with_services`;

CREATE ALGORITHM=UNDEFINED DEFINER=`` SQL SECURITY DEFINER VIEW `reservations_with_services`  AS SELECT `r`.`id` AS `id`, `r`.`client_id` AS `client_id`, `r`.`service_id` AS `service_id`, `r`.`date_reservation` AS `date_reservation`, `r`.`heure_debut` AS `heure_debut`, `r`.`heure_fin` AS `heure_fin`, `r`.`statut` AS `statut`, `r`.`reservation_status` AS `reservation_status`, `r`.`prix_service` AS `prix_service`, `r`.`prix_final` AS `prix_final`, `r`.`client_nom` AS `client_nom`, `r`.`client_prenom` AS `client_prenom`, `r`.`client_telephone` AS `client_telephone`, `r`.`client_email` AS `client_email`, `r`.`notes_client` AS `notes_client`, `r`.`verification_code` AS `verification_code`, `r`.`verification_token` AS `verification_token`, `r`.`session_id` AS `session_id`, `r`.`couleurs_choisies` AS `couleurs_choisies`, `r`.`date_creation` AS `date_creation`, `r`.`date_modification` AS `date_modification`, `r`.`referral_code_id` AS `referral_code_id`, `r`.`has_addon` AS `has_addon`, `r`.`addon_service_ids` AS `addon_service_ids`, `r`.`has_healing_addon` AS `has_healing_addon`, `r`.`addon_price` AS `addon_price`, `r`.`jotform_submission_id` AS `jotform_submission_id`, `r`.`uses_items_table` AS `uses_items_table`, CASE WHEN `r`.`uses_items_table` = 0 THEN `r`.`service_id` ELSE (select `reservation_items`.`service_id` from `reservation_items` where `reservation_items`.`reservation_id` = `r`.`id` and `reservation_items`.`item_type` = 'main' limit 1) END AS `primary_service_id`, coalesce((select count(0) from `reservation_items` where `reservation_items`.`reservation_id` = `r`.`id`),0) AS `service_count`, CASE WHEN `r`.`uses_items_table` = 1 THEN coalesce((select sum(`reservation_items`.`prix`) from `reservation_items` where `reservation_items`.`reservation_id` = `r`.`id`),`r`.`prix_final`) ELSE `r`.`prix_final` END AS `calculated_total` FROM `reservations` AS `r` ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_active_client_memberships`
--
DROP TABLE IF EXISTS `v_active_client_memberships`;

CREATE ALGORITHM=UNDEFINED DEFINER=`` SQL SECURITY DEFINER VIEW `v_active_client_memberships`  AS SELECT `cm`.`id` AS `client_membership_id`, `cm`.`client_id` AS `client_id`, `c`.`prenom` AS `client_prenom`, `c`.`nom` AS `client_nom`, `c`.`email` AS `client_email`, `cm`.`membership_id` AS `membership_id`, `m`.`nom` AS `membership_nom`, `cm`.`date_debut` AS `date_debut`, `cm`.`date_fin` AS `date_fin`, `cm`.`statut` AS `statut`, `cm`.`services_total` AS `services_total`, `cm`.`services_utilises` AS `services_utilises`, `cm`.`services_restants` AS `services_restants`, `cm`.`montant_paye` AS `montant_paye`, `cm`.`mode_paiement` AS `mode_paiement`, `cm`.`duree_engagement` AS `duree_engagement`, to_days(`cm`.`date_fin`) - to_days(curdate()) AS `jours_restants`, CASE WHEN `cm`.`date_fin` < curdate() THEN 'expired' WHEN `cm`.`services_restants` <= 0 THEN 'no_services' WHEN to_days(`cm`.`date_fin`) - to_days(curdate()) <= 7 THEN 'expiring_soon' ELSE 'active' END AS `status_detail` FROM ((`client_memberships` `cm` join `clients` `c` on(`cm`.`client_id` = `c`.`id`)) join `memberships` `m` on(`cm`.`membership_id` = `m`.`id`)) WHERE `cm`.`statut` = 'active' ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_pending_scheduled_memberships`
--
DROP TABLE IF EXISTS `v_pending_scheduled_memberships`;

CREATE ALGORITHM=UNDEFINED DEFINER=`` SQL SECURITY DEFINER VIEW `v_pending_scheduled_memberships`  AS SELECT `cm`.`id` AS `id`, `cm`.`client_id` AS `client_id`, `c`.`prenom` AS `client_prenom`, `c`.`nom` AS `client_nom`, `c`.`email` AS `client_email`, `cm`.`membership_id` AS `membership_id`, `m`.`nom` AS `membership_nom`, `m`.`services_par_mois` AS `services_par_mois`, `cm`.`duree_engagement` AS `duree_mois`, `cm`.`montant_paye` AS `montant_prevu`, `cm`.`statut` AS `statut`, `cm`.`notes` AS `notes`, `cm`.`date_creation` AS `date_scheduled`, `cm`.`date_activated` AS `date_activated`, `cm`.`date_cancelled` AS `date_cancelled`, `cm`.`activated_by` AS `activated_by` FROM ((`client_memberships` `cm` join `clients` `c` on(`cm`.`client_id` = `c`.`id`)) join `memberships` `m` on(`cm`.`membership_id` = `m`.`id`)) WHERE `cm`.`statut` = 'pending' ORDER BY `cm`.`date_creation` DESC ;

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
-- Index pour la table `client_memberships`
--
ALTER TABLE `client_memberships`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_client_membership_membership` (`membership_id`),
  ADD KEY `idx_client_status` (`client_id`,`statut`),
  ADD KEY `idx_expiration` (`date_fin`,`statut`),
  ADD KEY `idx_active_memberships` (`statut`,`date_fin`),
  ADD KEY `fk_client_membership_activated_by` (`activated_by`),
  ADD KEY `idx_scheduled_status` (`statut`,`date_creation`),
  ADD KEY `idx_activation_dates` (`date_activated`,`date_cancelled`);

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
-- Index pour la table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `idx_products_category` (`category`),
  ADD KEY `idx_products_active` (`is_active`),
  ADD KEY `idx_products_featured` (`is_featured`),
  ADD KEY `idx_products_sku` (`sku`),
  ADD KEY `category_id` (`category_id`);

--
-- Index pour la table `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_product_categories_active` (`is_active`),
  ADD KEY `idx_product_categories_order` (`display_order`);

--
-- Index pour la table `product_category_translations`
--
ALTER TABLE `product_category_translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_language` (`category_id`,`language_code`),
  ADD KEY `idx_language` (`language_code`),
  ADD KEY `idx_category_id` (`category_id`);

--
-- Index pour la table `product_translations`
--
ALTER TABLE `product_translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_language` (`product_id`,`language_code`),
  ADD KEY `idx_language` (`language_code`),
  ADD KEY `idx_product_id` (`product_id`);

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
  ADD KEY `referral_code_id` (`referral_code_id`),
  ADD KEY `idx_reservations_jotform_id` (`jotform_submission_id`),
  ADD KEY `idx_membership_reservations` (`client_membership_id`,`statut`);

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
-- Index pour la table `store_orders`
--
ALTER TABLE `store_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_store_orders_client` (`client_id`),
  ADD KEY `idx_store_orders_status` (`status`),
  ADD KEY `idx_store_orders_created` (`created_at`),
  ADD KEY `idx_store_orders_number` (`order_number`),
  ADD KEY `idx_store_orders_session` (`session_id`),
  ADD KEY `idx_store_orders_status_session` (`status`,`session_id`);

--
-- Index pour la table `store_order_items`
--
ALTER TABLE `store_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_store_order_items_order` (`order_id`),
  ADD KEY `idx_store_order_items_product` (`product_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT pour la table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT pour la table `client_login_attempts`
--
ALTER TABLE `client_login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `client_memberships`
--
ALTER TABLE `client_memberships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- AUTO_INCREMENT pour la table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `product_categories`
--
ALTER TABLE `product_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `product_category_translations`
--
ALTER TABLE `product_category_translations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `product_translations`
--
ALTER TABLE `product_translations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT pour la table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `referral_codes`
--
ALTER TABLE `referral_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT pour la table `referral_usage`
--
ALTER TABLE `referral_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT pour la table `reservation_addons`
--
ALTER TABLE `reservation_addons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `reservation_items`
--
ALTER TABLE `reservation_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT pour la table `security_settings`
--
ALTER TABLE `security_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT pour la table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT pour la table `services_translations`
--
ALTER TABLE `services_translations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=136;

--
-- AUTO_INCREMENT pour la table `store_orders`
--
ALTER TABLE `store_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `store_order_items`
--
ALTER TABLE `store_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- Contraintes pour la table `client_memberships`
--
ALTER TABLE `client_memberships`
  ADD CONSTRAINT `fk_client_membership_activated_by` FOREIGN KEY (`activated_by`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_client_membership_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_client_membership_membership` FOREIGN KEY (`membership_id`) REFERENCES `memberships` (`id`);

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
-- Contraintes pour la table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `product_category_translations`
--
ALTER TABLE `product_category_translations`
  ADD CONSTRAINT `product_category_translations_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `product_translations`
--
ALTER TABLE `product_translations`
  ADD CONSTRAINT `product_translations_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `fk_reservation_client_membership` FOREIGN KEY (`client_membership_id`) REFERENCES `client_memberships` (`id`) ON DELETE SET NULL,
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

--
-- Contraintes pour la table `store_orders`
--
ALTER TABLE `store_orders`
  ADD CONSTRAINT `store_orders_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `store_order_items`
--
ALTER TABLE `store_order_items`
  ADD CONSTRAINT `store_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `store_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `store_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
