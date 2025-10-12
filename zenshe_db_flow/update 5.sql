-- ============================================================================
-- ZENSHE SPA - Client Memberships Integration
-- ============================================================================
-- This script adds client membership tracking and booking integration
-- Date: 2025-10-11
-- Author: AI Assistant
-- ============================================================================

USE zenshespa_database;

-- ============================================================================
-- STEP 1: Create client_memberships table
-- ============================================================================
-- This table tracks which clients have purchased which memberships

CREATE TABLE IF NOT EXISTS `client_memberships` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `client_id` INT(11) NOT NULL,
    `membership_id` INT(11) NOT NULL,
    
    -- Subscription period
    `date_debut` DATE NOT NULL COMMENT 'Start date of membership period',
    `date_fin` DATE NOT NULL COMMENT 'End date of membership period',
    `statut` ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'active' COMMENT 'Membership status',
    
    -- Service usage tracking
    `services_total` INT(11) NOT NULL COMMENT 'Total services allowed per period',
    `services_utilises` INT(11) DEFAULT 0 COMMENT 'Number of services used',
    `services_restants` INT(11) GENERATED ALWAYS AS (`services_total` - `services_utilises`) STORED COMMENT 'Remaining services (auto-calculated)',
    
    -- Payment information
    `montant_paye` DECIMAL(10,2) NOT NULL COMMENT 'Amount paid for this membership',
    `mode_paiement` ENUM('cash', 'card', 'bank_transfer', 'online') NOT NULL COMMENT 'Payment method',
    `duree_engagement` INT(11) DEFAULT 1 COMMENT 'Duration in months (1 or 3)',
    
    -- Metadata
    `notes` TEXT DEFAULT NULL COMMENT 'Admin notes about this membership',
    `date_creation` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `date_modification` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    
    -- Foreign keys
    CONSTRAINT `fk_client_membership_client` 
        FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) 
        ON DELETE CASCADE,
    
    CONSTRAINT `fk_client_membership_membership` 
        FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) 
        ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX `idx_client_status` (`client_id`, `statut`),
    INDEX `idx_expiration` (`date_fin`, `statut`),
    INDEX `idx_active_memberships` (`statut`, `date_fin`)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks client membership subscriptions and usage';

-- ============================================================================
-- STEP 2: Add membership fields to reservations table
-- ============================================================================
-- This allows reservations to be linked to a membership

ALTER TABLE `reservations`
ADD COLUMN `client_membership_id` INT(11) DEFAULT NULL COMMENT 'Link to client membership if used',
ADD COLUMN `uses_membership` TINYINT(1) DEFAULT 0 COMMENT 'Whether this reservation uses a membership',
ADD CONSTRAINT `fk_reservation_client_membership` 
    FOREIGN KEY (`client_membership_id`) REFERENCES `client_memberships`(`id`) 
    ON DELETE SET NULL;

-- Add index for membership reservations
ALTER TABLE `reservations`
ADD INDEX `idx_membership_reservations` (`client_membership_id`, `statut`);

-- ============================================================================
-- STEP 3: Create trigger to auto-update membership usage
-- ============================================================================
-- Automatically decrement services_restants when a membership reservation is confirmed

DELIMITER $$

CREATE TRIGGER `trg_membership_usage_on_confirm` 
AFTER UPDATE ON `reservations`
FOR EACH ROW
BEGIN
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
END$$

DELIMITER ;

-- ============================================================================
-- STEP 4: Create trigger to restore membership usage on cancellation
-- ============================================================================
-- Restore services_restants if a membership reservation is cancelled

DELIMITER $$

CREATE TRIGGER `trg_membership_refund_on_cancel` 
AFTER UPDATE ON `reservations`
FOR EACH ROW
BEGIN
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
END$$

DELIMITER ;

-- ============================================================================
-- STEP 5: Create view for active client memberships
-- ============================================================================
-- Easy query to get all active memberships with client and membership details

CREATE OR REPLACE VIEW `v_active_client_memberships` AS
SELECT 
    cm.id AS client_membership_id,
    cm.client_id,
    c.prenom AS client_prenom,
    c.nom AS client_nom,
    c.email AS client_email,
    cm.membership_id,
    m.nom AS membership_nom,
    cm.date_debut,
    cm.date_fin,
    cm.statut,
    cm.services_total,
    cm.services_utilises,
    cm.services_restants,
    cm.montant_paye,
    cm.mode_paiement,
    cm.duree_engagement,
    DATEDIFF(cm.date_fin, CURDATE()) AS jours_restants,
    CASE 
        WHEN cm.date_fin < CURDATE() THEN 'expired'
        WHEN cm.services_restants <= 0 THEN 'no_services'
        WHEN DATEDIFF(cm.date_fin, CURDATE()) <= 7 THEN 'expiring_soon'
        ELSE 'active'
    END AS status_detail
FROM client_memberships cm
JOIN clients c ON cm.client_id = c.id
JOIN memberships m ON cm.membership_id = m.id
WHERE cm.statut = 'active';

-- ============================================================================
-- STEP 6: Create stored procedure to purchase membership
-- ============================================================================
-- Simplified membership purchase process

DELIMITER $$

CREATE PROCEDURE `sp_purchase_membership`(
    IN p_client_id INT,
    IN p_membership_id INT,
    IN p_duree_engagement INT, -- 1 or 3 months
    IN p_mode_paiement VARCHAR(20),
    OUT p_client_membership_id INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_services_par_mois INT;
    DECLARE v_prix DECIMAL(10,2);
    DECLARE v_date_fin DATE;
    
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_message = 'Erreur lors de l\'achat de l\'abonnement';
        SET p_client_membership_id = NULL;
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- Get membership details
    SELECT services_par_mois, 
           CASE WHEN p_duree_engagement = 3 THEN COALESCE(prix_3_mois, prix_mensuel) ELSE prix_mensuel END
    INTO v_services_par_mois, v_prix
    FROM memberships
    WHERE id = p_membership_id AND actif = 1;
    
    IF v_services_par_mois IS NULL THEN
        SET p_message = 'Abonnement non trouvé ou inactif';
        SET p_client_membership_id = NULL;
        ROLLBACK;
    ELSE
        -- Calculate end date
        SET v_date_fin = DATE_ADD(CURDATE(), INTERVAL p_duree_engagement MONTH);
        
        -- Create client membership
        INSERT INTO client_memberships (
            client_id, 
            membership_id, 
            date_debut, 
            date_fin, 
            statut,
            services_total,
            services_utilises,
            services_restants,
            montant_paye,
            mode_paiement,
            duree_engagement
        ) VALUES (
            p_client_id,
            p_membership_id,
            CURDATE(),
            v_date_fin,
            'active',
            v_services_par_mois,
            0,
            v_services_par_mois,
            v_prix,
            p_mode_paiement,
            p_duree_engagement
        );
        
        SET p_client_membership_id = LAST_INSERT_ID();
        SET p_message = 'Abonnement activé avec succès';
        
        COMMIT;
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- STEP 7: Create stored procedure to check active membership
-- ============================================================================
-- Quick check if client has an active membership with available services

DELIMITER $$

CREATE PROCEDURE `sp_check_active_membership`(
    IN p_client_id INT,
    OUT p_has_active BOOLEAN,
    OUT p_client_membership_id INT,
    OUT p_services_restants INT,
    OUT p_membership_nom VARCHAR(100)
)
BEGIN
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

DELIMITER ;

-- ============================================================================
-- STEP 8: Insert sample data for testing (OPTIONAL - Comment out in production)
-- ============================================================================

-- Sample: Client 12 (yassinefrigui9@gmail.com) purchases GOLD membership
CALL sp_purchase_membership(
    12,              -- client_id
    2,               -- membership_id (GOLD)
    1,               -- duration: 1 month
    'card',          -- payment method
    @membership_id,  -- output: client_membership_id
    @message         -- output: message
);

SELECT @membership_id AS client_membership_id, @message AS message;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
SELECT 
    'client_memberships' AS table_name,
    COUNT(*) AS record_count
FROM client_memberships

UNION ALL

SELECT 
    'v_active_client_memberships' AS table_name,
    COUNT(*) AS record_count
FROM v_active_client_memberships;

-- Show active memberships
SELECT * FROM v_active_client_memberships;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- Next steps:
-- 1. Update backend models (ClientMembership.js)
-- 2. Create backend routes (/api/client/memberships)
-- 3. Update reservation routes to handle membership bookings
-- 4. Create frontend MembershipContext
-- 5. Update BookingPage to show membership option
-- ============================================================================
