-- Add global currency support and admin features
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD';

-- Create admin products table for 100% commission products
CREATE TABLE IF NOT EXISTS admin_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT,
  product_type TEXT DEFAULT 'digital',
  file_url TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_products
ALTER TABLE admin_products ENABLE ROW LEVEL SECURITY;

-- Create policies for admin products
CREATE POLICY "Admin products viewable by everyone" ON admin_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage admin products" ON admin_products FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Create messaging system tables
CREATE TABLE IF NOT EXISTS conversations_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'open',
  is_support_ticket BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID,
  sender_email TEXT,
  content TEXT NOT NULL,
  is_from_support BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_v2 ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their conversations" ON conversations_v2 
  FOR SELECT USING (user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin');
  
CREATE POLICY "Users can create conversations" ON conversations_v2 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations" ON messages_v2 
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations_v2 
      WHERE user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin'
    )
  );

CREATE POLICY "Users can send messages" ON messages_v2 
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations_v2 
      WHERE user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin'
    )
  );

-- Add view preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS product_view_preference TEXT DEFAULT 'grid';

-- Create currency rates table for global support
CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert basic currency rates
INSERT INTO currency_rates (target_currency, rate) VALUES
  ('NGN', 1600), ('GBP', 0.79), ('EUR', 0.92), ('CAD', 1.36),
  ('AUD', 1.53), ('JPY', 149.50), ('INR', 83.20), ('ZAR', 18.85),
  ('KES', 129.50), ('GHS', 12.10)
ON CONFLICT DO NOTHING;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_products_updated_at
  BEFORE UPDATE ON admin_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_v2_updated_at
  BEFORE UPDATE ON conversations_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();