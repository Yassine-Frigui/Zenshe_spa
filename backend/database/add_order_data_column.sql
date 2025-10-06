-- Add missing order_data column to store_orders table for draft functionality
-- This column stores JSON data for draft orders

ALTER TABLE store_orders 
ADD COLUMN order_data TEXT COMMENT 'JSON data for draft orders containing cart items and form data';

-- Add index for better performance on draft queries
CREATE INDEX idx_store_orders_status_session ON store_orders(status, session_id);