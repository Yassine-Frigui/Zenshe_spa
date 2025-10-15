-- Migration: Add reminder fields to reservations table
-- Date: October 14, 2025

ALTER TABLE reservations
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE COMMENT 'Whether reminder has been sent for this reservation',
ADD COLUMN reminder_sent_at TIMESTAMP NULL COMMENT 'Timestamp when reminder was sent';

-- Add index for performance on reminder queries
CREATE INDEX idx_reservations_reminder_sent ON reservations(reminder_sent);
CREATE INDEX idx_reservations_statut_date ON reservations(statut, date_reservation, heure_debut);