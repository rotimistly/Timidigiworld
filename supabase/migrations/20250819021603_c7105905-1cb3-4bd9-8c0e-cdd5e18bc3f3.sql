-- Fix remaining security issues

-- 1. Fix the booking_history view - check if it has SECURITY DEFINER
-- Drop and recreate without SECURITY DEFINER if needed
DROP VIEW IF EXISTS public.booking_history CASCADE;
CREATE VIEW public.booking_history AS
SELECT 
  b.id,
  b.user_id,
  b.service_id,
  b.provider_id,
  b.booking_date,
  b.booking_time,
  b.service_location,
  b.notes,
  b.amount,
  b.currency,
  b.status,
  b.payment_method,
  b.payment_status,
  b.created_at,
  b.updated_at,
  b.product_service_id,
  b.custom_time,
  ps.title AS service_title,
  ps.description AS service_description,
  provider_profile.full_name AS provider_name,
  provider_profile.provider_phone,
  customer_profile.full_name AS customer_name
FROM bookings b
LEFT JOIN product_services ps ON b.product_service_id = ps.id
LEFT JOIN profiles provider_profile ON b.provider_id = provider_profile.user_id
LEFT JOIN profiles customer_profile ON b.user_id = customer_profile.user_id;

-- 2. Fix the update_updated_at_column function to have proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;