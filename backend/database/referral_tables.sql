-- Referral Codes System Tables

-- Table to store referral codes
CREATE TABLE IF NOT EXISTS referral_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    owner_client_id INT NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 10.00,
    max_uses INT DEFAULT NULL, -- NULL means unlimited uses
    current_uses INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (owner_client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Table to track referral code usage
CREATE TABLE IF NOT EXISTS referral_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referral_code_id INT NOT NULL,
    used_by_client_id INT NOT NULL,
    reservation_id INT NULL, -- Links to specific reservation if used during booking
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_code_id) REFERENCES referral_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by_client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_code (referral_code_id, used_by_client_id) -- Prevents same person from using same code twice
);

-- Add referral code column to reservations table (if not exists)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS referral_code_id INT NULL,
ADD FOREIGN KEY (referral_code_id) REFERENCES referral_codes(id) ON DELETE SET NULL;

-- Add referral code column to clients table (to track who referred them)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS referred_by_code_id INT NULL,
ADD FOREIGN KEY (referred_by_code_id) REFERENCES referral_codes(id) ON DELETE SET NULL;

-- Index for better performance
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_usage_client ON referral_usage(used_by_client_id);
CREATE INDEX idx_referral_codes_owner ON referral_codes(owner_client_id);