-- Fix for rental approval status issue
-- Adding 'rented', 'picked_up', and 'returned' to the approval_status ENUM to match the business logic

ALTER TABLE order_items MODIFY COLUMN approval_status ENUM(
    'auto_confirmed',
    'pending_review', 
    'price_confirmation', 
    'confirmed', 
    'cancelled', 
    'ready_for_pickup', 
    'completed', 
    'price_declined',
    'rented',
    'picked_up',
    'returned'
) DEFAULT 'pending_review';