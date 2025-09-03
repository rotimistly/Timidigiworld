-- Remove direct file URLs from public access and create secure download tokens
-- First, let's add a secure token system for downloads
CREATE TABLE IF NOT EXISTS public.download_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on download tokens
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;

-- Only users can view their own download tokens
CREATE POLICY "Users can view their own download tokens" 
ON public.download_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can create and update tokens
CREATE POLICY "Service can manage download tokens" 
ON public.download_tokens 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to generate secure download token
CREATE OR REPLACE FUNCTION public.generate_download_token(
  p_order_id UUID,
  p_user_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_value TEXT;
BEGIN
  -- Generate a secure random token
  token_value := encode(gen_random_bytes(32), 'base64url');
  
  -- Insert the token
  INSERT INTO public.download_tokens (order_id, user_id, token, expires_at)
  VALUES (p_order_id, p_user_id, token_value, now() + INTERVAL '1 hour');
  
  RETURN token_value;
END;
$$;

-- Create function to validate and consume download token
CREATE OR REPLACE FUNCTION public.validate_download_token(
  p_token TEXT,
  p_user_id UUID
) RETURNS TABLE(
  order_id UUID,
  product_id UUID,
  file_url TEXT,
  product_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Get and validate token
  SELECT dt.*, o.product_id, p.file_url, p.title
  INTO token_record
  FROM public.download_tokens dt
  JOIN public.orders o ON dt.order_id = o.id
  LEFT JOIN public.products p ON o.product_id = p.id
  LEFT JOIN public.admin_products ap ON o.product_id = ap.id
  WHERE dt.token = p_token 
    AND dt.user_id = p_user_id 
    AND dt.expires_at > now() 
    AND dt.used = false;

  -- Check if token exists and is valid
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired download token';
  END IF;

  -- Mark token as used
  UPDATE public.download_tokens 
  SET used = true, updated_at = now()
  WHERE id = token_record.id;

  -- Return product info
  RETURN QUERY SELECT 
    token_record.order_id,
    token_record.product_id,
    COALESCE(token_record.file_url, (
      SELECT ap.file_url FROM public.admin_products ap WHERE ap.id = token_record.product_id
    )),
    COALESCE(token_record.title, (
      SELECT ap.title FROM public.admin_products ap WHERE ap.id = token_record.product_id
    ));
END;
$$;