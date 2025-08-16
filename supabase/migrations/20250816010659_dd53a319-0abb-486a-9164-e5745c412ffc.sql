-- Add bank details and payment info to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS account_name text,
ADD COLUMN IF NOT EXISTS paystack_subaccount_code text,
ADD COLUMN IF NOT EXISTS bank_code text;

-- Add ratings system for products
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for product_reviews
CREATE POLICY "Anyone can view product reviews" 
ON public.product_reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for purchased products" 
ON public.product_reviews FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.orders o 
    JOIN public.products p ON o.product_id = p.id 
    WHERE p.id = product_reviews.product_id 
    AND o.buyer_id = auth.uid() 
    AND o.status IN ('completed', 'delivered')
  )
);

CREATE POLICY "Users can update their own reviews" 
ON public.product_reviews FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update orders table to support Paystack
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS paystack_reference text UNIQUE,
ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'paystack';