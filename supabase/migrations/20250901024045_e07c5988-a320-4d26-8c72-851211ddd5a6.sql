-- Add bank account details to profiles for payment splits
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS routing_number TEXT;

-- Create payment splits table to track automatic payments
CREATE TABLE IF NOT EXISTS public.payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  total_amount NUMERIC NOT NULL,
  platform_amount NUMERIC NOT NULL,
  seller_amount NUMERIC NOT NULL,
  platform_paid BOOLEAN DEFAULT false,
  seller_paid BOOLEAN DEFAULT false,
  payment_gateway TEXT DEFAULT 'paystack',
  platform_reference TEXT,
  seller_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their payment splits" ON payment_splits
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Service can create payment splits" ON payment_splits
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service can update payment splits" ON payment_splits
  FOR UPDATE USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_payment_splits_updated_at
  BEFORE UPDATE ON public.payment_splits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();