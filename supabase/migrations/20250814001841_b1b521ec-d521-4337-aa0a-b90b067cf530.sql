-- Add product type to distinguish digital vs physical products
ALTER TABLE public.products ADD COLUMN product_type TEXT DEFAULT 'digital' CHECK (product_type IN ('digital', 'physical'));

-- Add shipping information for physical products
ALTER TABLE public.products ADD COLUMN shipping_required BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN shipping_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN weight NUMERIC(10,2); -- for shipping calculations

-- Create chat conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, buyer_id, seller_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create support tickets table for owner communication
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create support messages for ongoing communication
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID,
  sender_email TEXT,
  content TEXT NOT NULL,
  is_from_support BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add user roles for admin access
ALTER TABLE public.profiles ADD COLUMN user_role TEXT DEFAULT 'user' CHECK (user_role IN ('user', 'seller', 'admin'));

-- Enable RLS on all new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations as buyers" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Messages policies  
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages as read" ON public.messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- Support tickets policies
CREATE POLICY "Users can view their own support tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE user_role = 'admin'
  ));

CREATE POLICY "Anyone can create support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update support tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE user_role = 'admin'
  ));

-- Support messages policies
CREATE POLICY "Users can view messages in their support tickets" ON public.support_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE user_id = auth.uid() OR auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE user_role = 'admin'
      )
    )
  );

CREATE POLICY "Users can send messages to their support tickets" ON public.support_messages
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE user_id = auth.uid() OR auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE user_role = 'admin'
      )
    )
  );

-- Add triggers for updated_at columns
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time for chat functionality
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;

-- Add tables to real-time publication
INSERT INTO supabase_realtime.subscription_status (publication_name) VALUES ('supabase_realtime');
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;