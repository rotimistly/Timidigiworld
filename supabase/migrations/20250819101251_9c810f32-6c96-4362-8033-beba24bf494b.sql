-- Allow users to delete their own pending orders
CREATE POLICY "Users can delete their pending orders" 
ON public.orders 
FOR DELETE 
USING (
  auth.uid() = buyer_id 
  AND status = 'pending'
);