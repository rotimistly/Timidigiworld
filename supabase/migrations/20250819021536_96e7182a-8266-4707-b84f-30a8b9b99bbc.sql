-- Fix security issues detected by linter

-- 1. Fix the safe_profiles view security definer issue
-- Replace the existing view with a regular view (not SECURITY DEFINER)
DROP VIEW IF EXISTS public.safe_profiles;

-- Recreate as a regular view without SECURITY DEFINER
CREATE VIEW public.safe_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  bio,
  avatar_url,
  location,
  about,
  user_role,
  completed_bookings,
  average_rating,
  total_reviews,
  is_verified,
  is_provider,
  is_seller,
  specialties,
  skills,
  languages,
  certifications,
  education,
  years_experience,
  hourly_rate,
  website_url,
  portfolio_urls,
  region,
  currency,
  preferred_currency,
  availability_status,
  profile_image_url,
  created_at,
  updated_at
FROM public.profiles;

-- 2. Fix function search paths for security definer functions
-- Update all security definer functions to have fixed search paths

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT user_role FROM public.profiles WHERE profiles.user_id = $1;
$$;

-- Fix handle_new_user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_region TEXT;
  user_currency TEXT;
BEGIN
  -- Get region from user metadata, default to 'US'
  user_region := COALESCE(NEW.raw_user_meta_data->>'region', 'US');
  
  -- Get currency based on region
  user_currency := public.get_currency_for_region(user_region);
  
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    region, 
    currency
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    user_region,
    user_currency
  );
  
  RETURN NEW;
END;
$$;

-- Fix get_currency_for_region function
CREATE OR REPLACE FUNCTION public.get_currency_for_region(region_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
BEGIN
  RETURN CASE region_code
    WHEN 'NG' THEN 'NGN'
    WHEN 'UK' THEN 'GBP'
    WHEN 'ZA' THEN 'ZAR'
    WHEN 'KE' THEN 'KES'
    WHEN 'GH' THEN 'GHS'
    WHEN 'DE' THEN 'EUR'
    WHEN 'FR' THEN 'EUR'
    ELSE 'USD'
  END;
END;
$$;

-- Fix other security definer functions
CREATE OR REPLACE FUNCTION public.update_provider_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update completed bookings count for provider
  UPDATE public.profiles 
  SET completed_bookings = (
    SELECT COUNT(*) 
    FROM public.bookings 
    WHERE provider_id = NEW.provider_id 
    AND status = 'completed'
  )
  WHERE user_id = NEW.provider_id;
  
  -- Auto-verify provider if they have 5+ completed bookings
  UPDATE public.profiles 
  SET is_verified = TRUE, verification_date = NOW()
  WHERE user_id = NEW.provider_id 
  AND completed_bookings >= 5 
  AND is_verified = FALSE;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating), 2) 
      FROM public.reviews 
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.reviews 
      WHERE provider_id = NEW.provider_id
    )
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_pending_tracking_history(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.order_tracking_history 
  WHERE order_id IN (
    SELECT o.id FROM orders o 
    WHERE o.buyer_id = user_uuid AND o.status = 'pending'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_digital_product_access(order_uuid uuid)
RETURNS TABLE(file_url text, product_title text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT p.file_url, p.title
  FROM orders o
  JOIN products p ON o.product_id = p.id
  WHERE o.id = order_uuid 
    AND o.buyer_id = auth.uid()
    AND o.status IN ('paid', 'completed', 'delivered')
    AND p.product_type = 'digital';
$$;

CREATE OR REPLACE FUNCTION public.get_booking_history_for_user(user_uuid uuid)
RETURNS TABLE(id uuid, user_id uuid, provider_id uuid, service_id uuid, product_service_id uuid, booking_date date, booking_time time without time zone, custom_time time without time zone, service_location text, amount numeric, currency text, payment_method text, payment_status text, status text, notes text, service_title text, service_description text, provider_name text, provider_phone text, customer_name text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT 
    b.id,
    b.user_id,
    b.provider_id,
    b.service_id,
    b.product_service_id,
    b.booking_date,
    b.booking_time,
    b.custom_time,
    b.service_location,
    b.amount,
    b.currency,
    b.payment_method,
    b.payment_status,
    b.status,
    b.notes,
    COALESCE(ps.title, s.title, 'Unknown Service') as service_title,
    COALESCE(ps.description, s.description, '') as service_description,
    pp.full_name as provider_name,
    pp.provider_phone,
    cp.full_name as customer_name,
    b.created_at,
    b.updated_at
  FROM bookings b
  LEFT JOIN product_services ps ON b.product_service_id = ps.id
  LEFT JOIN services s ON b.service_id = s.id
  LEFT JOIN profiles pp ON b.provider_id = pp.user_id
  LEFT JOIN profiles cp ON b.user_id = cp.user_id
  WHERE b.user_id = user_uuid OR b.provider_id = user_uuid
  ORDER BY b.created_at DESC;
$$;