-- Add new enum values for price confirmation workflow
ALTER TABLE order_items MODIFY COLUMN approval_status ENUM('auto_confirmed','pending_review','price_confirmation','confirmed','cancelled','ready_for_pickup','completed','price_declined') DEFAULT 'pending_review';

-- Add new status to order_tracking table if it doesn't exist
ALTER TABLE order_tracking MODIFY COLUMN status ENUM('pending','price_confirmation','in_progress','ready_to_pickup','picked_up','rented','returned','completed','cancelled','price_declined') DEFAULT 'pending';
