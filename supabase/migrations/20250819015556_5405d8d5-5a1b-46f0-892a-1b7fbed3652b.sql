-- Fix critical security issues (simplified policy)

-- 1. Prevent users from changing their own role (privilege escalation fix)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (no role changes)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND (get_user_role(auth.uid()) = 'admin' OR user_role = 'user'));

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

-- 3. Secure order notifications - only service role should create them
DROP POLICY IF EXISTS "System can create order notifications" ON public.order_notifications;

CREATE POLICY "Service role can create order notifications" 
ON public.order_notifications 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 4. Secure payment splits - only service role should create them  
DROP POLICY IF EXISTS "System can create payment splits" ON public.payment_splits;

CREATE POLICY "Service role can create payment splits" 
ON public.payment_splits 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 5. Add policy to prevent unauthorized order status updates
CREATE POLICY "Only sellers buyers and service can update orders" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() = buyer_id OR 
  auth.uid() = (SELECT seller_id FROM products WHERE id = orders.product_id) OR
  auth.role() = 'service_role'
);

-- 6. Secure digital product files - create secure access function
CREATE OR REPLACE FUNCTION public.get_digital_product_access(order_uuid uuid)
RETURNS TABLE(file_url text, product_title text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.file_url, p.title
  FROM orders o
  JOIN products p ON o.product_id = p.id
  WHERE o.id = order_uuid 
    AND o.buyer_id = auth.uid()
    AND o.status IN ('paid', 'completed', 'delivered')
    AND p.product_type = 'digital';
$$;