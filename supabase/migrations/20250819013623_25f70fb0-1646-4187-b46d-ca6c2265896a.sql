-- Fix critical security issues - Step 1: Drop existing function first

DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- 1. Create secure user role function (privilege escalation fix)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_role FROM public.profiles WHERE profiles.user_id = user_uuid;
$$;

-- Drop existing policy and create secure one
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (no role changes)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent role changes unless user is already admin
  (user_role = OLD.user_role OR get_user_role(auth.uid()) = 'admin')
);

-- 2. Protect sensitive PII data - create view for safe profile access
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  bio,
  avatar_url,
  location,
  about,
  skills,
  portfolio_urls,
  website_url,
  education,
  certifications,
  languages,
  is_seller,
  is_provider,
  is_verified,
  average_rating,
  total_reviews,
  completed_bookings,
  availability_status,
  specialties,
  hourly_rate,
  years_experience,
  profile_image_url,
  user_role,
  region,
  currency,
  preferred_currency,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to safe view
GRANT SELECT ON public.safe_profiles TO authenticated, anon;