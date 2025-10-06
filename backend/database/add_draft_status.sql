-- Update store_orders table to include 'draft' status for cart functionality
-- This allows saving incomplete orders as drafts

ALTER TABLE store_orders 
MODIFY COLUMN status ENUM('draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending';