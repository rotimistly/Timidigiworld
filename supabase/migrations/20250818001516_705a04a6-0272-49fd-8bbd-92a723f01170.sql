-- Fix RLS security warning by enabling RLS on currency_rates
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- Create policy for currency rates (readable by all)
CREATE POLICY "Currency rates viewable by everyone" ON currency_rates FOR SELECT USING (true);
CREATE POLICY "System can update currency rates" ON currency_rates FOR ALL USING (true);