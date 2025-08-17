-- Add delivery_email column to orders table for digital product delivery
ALTER TABLE orders ADD COLUMN delivery_email TEXT;

COMMENT ON COLUMN orders.delivery_email IS 'Email address where digital products will be delivered';