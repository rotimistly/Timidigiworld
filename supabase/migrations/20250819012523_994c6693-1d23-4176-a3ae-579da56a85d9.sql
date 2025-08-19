-- Fix function security issues by setting proper search paths

DROP FUNCTION IF EXISTS clear_pending_tracking_history(UUID);

CREATE OR REPLACE FUNCTION clear_pending_tracking_history(user_uuid UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.order_tracking_history 
  WHERE order_id IN (
    SELECT o.id FROM orders o 
    WHERE o.buyer_id = user_uuid AND o.status = 'pending'
  );
END;
$$;

-- Update existing function to have proper search path
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;