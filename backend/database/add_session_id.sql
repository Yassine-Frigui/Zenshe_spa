-- Add session_id column to store_orders table
-- This allows tracking order drafts by session before they are finalized

ALTER TABLE store_orders 
ADD COLUMN session_id VARCHAR(100) NULL COMMENT 'Session ID for draft orders' 
AFTER order_number;

-- Add index for session_id for better performance
CREATE INDEX idx_store_orders_session ON store_orders(session_id);