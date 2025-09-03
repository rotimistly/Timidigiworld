-- Hide direct file URLs from API responses by creating secure views
-- Create a secure products view that excludes file URLs for public access
CREATE OR REPLACE VIEW public.secure_products AS
SELECT 
  id,
  seller_id,
  title,
  description,
  price,
  currency,
  category,
  image_url,
  product_type,
  status,
  created_at,
  updated_at,
  shipping_required,
  shipping_cost,
  weight,
  file_size,
  file_type,
  -- Hide file_url from public view
  CASE 
    WHEN auth.uid() = seller_id THEN file_url
    ELSE NULL 
  END AS file_url
FROM public.products;

-- Create RLS policies for the secure view
ALTER VIEW public.secure_products SET (security_barrier = true);

-- Create secure admin products view
CREATE OR REPLACE VIEW public.secure_admin_products AS
SELECT 
  id,
  title,
  description,
  price,
  currency,
  category,
  image_url,
  product_type,
  status,
  created_at,
  updated_at,
  -- Hide file_url from public view for admin products too
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND user_role = 'admin'
    ) THEN file_url
    ELSE NULL 
  END AS file_url
FROM public.admin_products;

-- Set security barrier for admin products view
ALTER VIEW public.secure_admin_products SET (security_barrier = true);

-- Update the existing database function to be more secure
CREATE OR REPLACE FUNCTION public.get_digital_product_access(order_uuid uuid)
RETURNS TABLE(product_title text, order_status text, access_granted boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Return only access status, not file URLs
  SELECT 
    COALESCE(p.title, ap.title) as product_title,
    o.status as order_status,
    CASE 
      WHEN o.buyer_id = auth.uid() AND o.status IN ('paid', 'completed', 'delivered') THEN true
      ELSE false
    END as access_granted
  FROM orders o
  LEFT JOIN products p ON o.product_id = p.id
  LEFT JOIN admin_products ap ON o.product_id = ap.id
  WHERE o.id = order_uuid;
$$;