-- ============================================================================
-- ZENSHE SPA - Scheduled Memberships (Table Alter Approach)
-- ============================================================================
-- This script modifies the existing client_memberships table to support
-- scheduled memberships using the existing 'pending' status
-- Date: 2025-10-11
-- Author: AI Assistant
-- ============================================================================

USE zenshespa_database;

-- ============================================================================
-- STEP 1: Add columns for scheduled membership tracking
-- ============================================================================

-- Add columns to track activation process
ALTER TABLE `client_memberships`
ADD COLUMN `date_activated` DATETIME NULL COMMENT 'When admin activated the scheduled membership',
ADD COLUMN `date_cancelled` DATETIME NULL COMMENT 'When membership was cancelled',
ADD COLUMN `activated_by` INT(11) NULL COMMENT 'Admin user ID who activated the membership',

-- Add foreign key for admin who activated
ADD CONSTRAINT `fk_client_membership_activated_by`
    FOREIGN KEY (`activated_by`) REFERENCES `utilisateurs`(`id`)
    ON DELETE SET NULL;

-- Add indexes for performance
ALTER TABLE `client_memberships`
ADD INDEX `idx_scheduled_status` (`statut`, `date_creation`),
ADD INDEX `idx_activation_dates` (`date_activated`, `date_cancelled`);

-- ============================================================================
-- STEP 2: Update existing stored procedure to handle scheduled memberships
-- ============================================================================

DELIMITER $$

-- Drop existing procedure if it exists
DROP PROCEDURE IF EXISTS `sp_purchase_membership`$$

-- Create updated procedure that handles both immediate and scheduled memberships
CREATE PROCEDURE `sp_purchase_membership`(
    IN p_client_id INT,
    IN p_membership_id INT,
    IN p_date_debut DATE,
    IN p_date_fin DATE,
    IN p_montant DECIMAL(10,2),
    IN p_mode_paiement ENUM('cash', 'card', 'bank_transfer', 'online'),
    IN p_duree_mois INT,
    IN p_services_total INT,
    IN p_notes TEXT,
    IN p_is_scheduled BOOLEAN,
    OUT p_membership_id_out INT,
    OUT p_message VARCHAR(255)
)
BEGIN
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

-- ============================================================================
-- STEP 3: Create stored procedure for activating scheduled memberships
-- ============================================================================

CREATE PROCEDURE `sp_activate_scheduled_membership`(
    IN p_scheduled_id INT,
    IN p_admin_id INT,
    IN p_methode_paiement ENUM('cash', 'card', 'bank_transfer', 'online'),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
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

DELIMITER ;

-- ============================================================================
-- STEP 4: Create view for pending scheduled memberships (admin view)
-- ============================================================================

CREATE OR REPLACE VIEW `v_pending_scheduled_memberships` AS
SELECT
    cm.id,
    cm.client_id,
    c.prenom AS client_prenom,
    c.nom AS client_nom,
    c.email AS client_email,
    cm.membership_id,
    m.nom AS membership_nom,
    m.services_par_mois,
    cm.duree_engagement AS duree_mois,
    cm.montant_paye AS montant_prevu,
    cm.statut,
    cm.notes,
    cm.date_creation AS date_scheduled,
    cm.date_activated,
    cm.date_cancelled,
    cm.activated_by
FROM client_memberships cm
JOIN clients c ON cm.client_id = c.id
JOIN memberships m ON cm.membership_id = m.id
WHERE cm.statut = 'pending'
ORDER BY cm.date_creation DESC;

-- ============================================================================
-- STEP 5: Insert sample data for testing
-- ============================================================================

-- Insert a sample scheduled membership for testing
INSERT INTO client_memberships (
    client_id,
    membership_id,
    date_debut,
    date_fin,
    montant_paye,
    mode_paiement,
    duree_engagement,
    services_total,
    statut,
    notes
) VALUES (
    12, -- Assuming client ID 12 exists
    2,  -- Assuming GOLD membership ID
    CURDATE(), -- Will be set when activated
    DATE_ADD(CURDATE(), INTERVAL 3 MONTH), -- 3 months from activation
    550.00, -- Price for 3-month GOLD
    'cash', -- Will be updated when activated
    3, -- 3 months
    15, -- 5 services per month * 3 months
    'pending',
    'Scheduled membership - to be activated at spa visit'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check the table structure
DESCRIBE client_memberships;

-- Check pending memberships
SELECT * FROM v_pending_scheduled_memberships;

-- Check stored procedures exist
SELECT
    'sp_purchase_membership' AS procedure_name,
    COUNT(*) AS exists_flag
FROM information_schema.routines
WHERE routine_schema = 'zenshespa_database'
AND routine_name = 'sp_purchase_membership'

UNION ALL

SELECT
    'sp_activate_scheduled_membership' AS procedure_name,
    COUNT(*) AS exists_flag
FROM information_schema.routines
WHERE routine_schema = 'zenshespa_database'
AND routine_name = 'sp_activate_scheduled_membership';

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- Summary of changes:
-- 1. Added date_activated, date_cancelled, activated_by columns to client_memberships
-- 2. Updated sp_purchase_membership to handle scheduled memberships
-- 3. Created sp_activate_scheduled_membership for admin activation
-- 4. Created v_pending_scheduled_memberships view for admin dashboard
-- 5. Added sample pending membership for testing
--
-- Next steps:
-- 1. Run this migration
-- 2. Update backend routes to use existing client_memberships table
-- 3. Update frontend to work with altered table structure
-- ============================================================================