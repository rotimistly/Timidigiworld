-- Restore original functionality by removing secure download system
-- Drop the download tokens table
DROP TABLE IF EXISTS public.download_tokens CASCADE;

-- Drop the secure views
DROP VIEW IF EXISTS public.secure_products CASCADE;
DROP VIEW IF EXISTS public.secure_admin_products CASCADE;

-- Drop the token functions  
DROP FUNCTION IF EXISTS public.generate_download_token(UUID, UUID);
DROP FUNCTION IF EXISTS public.validate_download_token(TEXT, UUID);

-- Restore original get_digital_product_access function
DROP FUNCTION IF EXISTS public.get_digital_product_access(UUID);

CREATE OR REPLACE FUNCTION public.get_digital_product_access(order_uuid uuid)
RETURNS TABLE(file_url text, product_title text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(p.file_url, ap.file_url) as file_url, 
    COALESCE(p.title, ap.title) as product_title
  FROM orders o
  LEFT JOIN products p ON o.product_id = p.id
  LEFT JOIN admin_products ap ON o.product_id = ap.id
  WHERE o.id = order_uuid 
    AND o.buyer_id = auth.uid()
    AND o.status IN ('paid', 'completed', 'delivered')
    AND (p.product_type = 'digital' OR ap.product_type = 'digital');
$$;