-- Create proper seller-buyer messaging system
CREATE TABLE IF NOT EXISTS public.product_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on product_messages
ALTER TABLE public.product_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for product_messages
CREATE POLICY "Users can view messages in their conversations" ON public.product_messages
FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

CREATE POLICY "Users can send messages in their conversations" ON public.product_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
);

-- Create order tracking history table
CREATE TABLE IF NOT EXISTS public.order_tracking_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on order_tracking_history
ALTER TABLE public.order_tracking_history ENABLE ROW LEVEL SECURITY;

-- Create policy for order_tracking_history
CREATE POLICY "Users can view their order tracking history" ON public.order_tracking_history
FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE buyer_id = auth.uid() OR 
    product_id IN (SELECT id FROM products WHERE seller_id = auth.uid())
  )
);

-- Add function to clear pending tracking history
CREATE OR REPLACE FUNCTION clear_pending_tracking_history(user_uuid UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM public.order_tracking_history 
  WHERE order_id IN (
    SELECT o.id FROM orders o 
    WHERE o.buyer_id = user_uuid AND o.status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update products table to include better file support
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_messages_updated_at BEFORE UPDATE ON public.product_messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();