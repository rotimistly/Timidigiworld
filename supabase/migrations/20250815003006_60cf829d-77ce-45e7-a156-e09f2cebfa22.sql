-- Add tracking and payment features
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN commission_rate NUMERIC DEFAULT 0.04;
ALTER TABLE orders ADD COLUMN commission_amount NUMERIC;
ALTER TABLE orders ADD COLUMN seller_amount NUMERIC;
ALTER TABLE orders ADD COLUMN email_sent BOOLEAN DEFAULT false;

-- Add payment method to orders
ALTER TABLE orders ADD COLUMN payment_method TEXT;

-- Create notifications table for order updates
CREATE TABLE IF NOT EXISTS order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'shipped', 'delivered', 'paid', 'refunded'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for order notifications
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for order notifications
CREATE POLICY "Users can view their order notifications" 
ON order_notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can create order notifications" 
ON order_notifications 
FOR INSERT 
WITH CHECK (true);

-- Add product images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for product images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Create policies for product images
CREATE POLICY "Anyone can view product images" 
ON product_images 
FOR SELECT 
USING (true);

CREATE POLICY "Sellers can manage their product images" 
ON product_images 
FOR ALL 
USING (product_id IN (SELECT id FROM products WHERE seller_id = auth.uid()));

-- Add real-time for notifications and product images
ALTER TABLE order_notifications REPLICA IDENTITY FULL;
ALTER TABLE product_images REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE order_notifications;
ALTER publication supabase_realtime ADD TABLE product_images;