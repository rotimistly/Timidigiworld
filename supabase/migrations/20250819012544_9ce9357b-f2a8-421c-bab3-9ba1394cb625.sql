-- Fix only the new function security issue
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