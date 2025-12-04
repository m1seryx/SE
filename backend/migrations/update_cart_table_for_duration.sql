-- Add duration_days column to cart table
ALTER TABLE cart 
ADD COLUMN duration_days INT NULL AFTER rental_end_date;

-- Add duration_days column to order_items table
ALTER TABLE order_items 
ADD COLUMN duration_days INT NULL AFTER rental_end_date;

-- Update existing records to calculate duration_days from rental_start_date and rental_end_date
UPDATE cart 
SET duration_days = DATEDIFF(rental_end_date, rental_start_date)
WHERE rental_start_date IS NOT NULL AND rental_end_date IS NOT NULL;

UPDATE order_items 
SET duration_days = DATEDIFF(rental_end_date, rental_start_date)
WHERE rental_start_date IS NOT NULL AND rental_end_date IS NOT NULL;

-- Note: We're keeping rental_start_date and rental_end_date for backward compatibility
-- In future versions, we can remove these columns if needed