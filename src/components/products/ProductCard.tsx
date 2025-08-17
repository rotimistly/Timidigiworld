import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Download, ShoppingCart, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { ChatWindow } from '@/components/chat/ChatWindow';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  status: string;
  product_type: string;
  seller_id: string;
  shipping_cost?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      // Redirect to login
      return;
    }
    setShowPayment(true);
  };

  const handleContactSeller = async () => {
    if (!user) return;

    // Create or find conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('product_id', product.id)
      .eq('buyer_id', user.id)
      .eq('seller_id', product.seller_id)
      .single();

    if (existingConv) {
      setConversationId(existingConv.id);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id
        })
        .select('id')
        .single();

      if (newConv) {
        setConversationId(newConv.id);
      }
    }
    
    setShowChat(true);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          {product.image_url ? (
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
              <img 
                src={product.image_url} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
              <Download className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
            <div className="flex flex-col gap-1">
              {product.category && (
                <Badge variant="secondary" className="shrink-0">
                  {product.category}
                </Badge>
              )}
              <Badge variant={product.product_type === 'digital' ? 'default' : 'outline'} className="shrink-0">
                {product.product_type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1">
          <CardDescription className="line-clamp-3">
            {product.description || 'No description available'}
          </CardDescription>
          <div className="mt-4 space-y-2">
            <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
            {product.shipping_cost && product.shipping_cost > 0 && (
              <p className="text-sm text-muted-foreground">
                + ${product.shipping_cost.toFixed(2)} shipping
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-4 space-y-2">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={handleContactSeller} className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact
            </Button>
            <Button onClick={handleBuyNow} className="flex-1">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy Now
            </Button>
          </div>
        </CardFooter>
      </Card>

      {showPayment && (
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent>
            <PaymentForm 
              product={{
                ...product,
                product_type: product.product_type
              }} 
              onSuccess={() => setShowPayment(false)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {showChat && conversationId && (
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogContent className="max-w-2xl">
            <ChatWindow
              conversationId={conversationId}
              recipientId={product.seller_id}
              recipientName="Seller"
              productTitle={product.title}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}