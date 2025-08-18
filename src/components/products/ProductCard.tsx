import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Package, ShoppingCart, MessageSquare, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { ChatWindow } from '@/components/chat/ChatWindow';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description?: string | null;
    price: number;
    currency?: string;
    image_url?: string | null;
    category?: string | null;
    product_type: string;
    seller_id?: string;
    is_admin_product?: boolean;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  viewMode?: 'grid' | 'list';
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();

  const handleContactSeller = async () => {
    if (!user || !product.seller_id) return;

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

  const cardContent = (
    <div className="aspect-video relative bg-gradient-to-br from-purple-100 to-blue-100">
      {product.image_url ? (
        <img 
          src={product.image_url} 
          alt={product.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <Package className="h-16 w-16 text-gray-400" />
        </div>
      )}
      {product.category && (
        <Badge className="absolute top-2 left-2" variant="secondary">
          {product.category}
        </Badge>
      )}
      <Badge 
        className="absolute top-2 right-2" 
        variant={product.product_type === 'digital' ? 'default' : 'outline'}
      >
        {product.product_type}
      </Badge>
      {product.is_admin_product && (
        <Badge className="absolute bottom-2 left-2 bg-green-600">
          Admin Product
        </Badge>
      )}
    </div>
  );

  const productInfo = (
    <CardContent className="p-4">
      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {product.description || "No description available"}
      </p>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-primary">
          {product.currency ? `${product.currency} ${product.price}` : `$${product.price}`}
        </span>
        <div className="flex items-center text-sm text-gray-500">
          <User className="h-4 w-4 mr-1" />
          {product.profiles?.full_name || "Unknown Seller"}
        </div>
      </div>
      
      <div className="flex gap-2">
        {!product.is_admin_product && product.seller_id && (
          <Button 
            variant="outline" 
            onClick={handleContactSeller}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact
          </Button>
        )}
        <Button 
          onClick={() => setShowPayment(true)}
          className="flex-1"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Buy Now
        </Button>
      </div>
    </CardContent>
  );

  return (
    <>
      {viewMode === 'list' ? (
        <Card className="flex overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="w-48 flex-shrink-0">
            {cardContent}
          </div>
          <div className="flex-1">
            {productInfo}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          {cardContent}
          {productInfo}
        </Card>
      )}

      {showPayment && (
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent className="max-w-2xl">
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

      {showChat && conversationId && product.seller_id && (
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogContent className="max-w-2xl">
            <ChatWindow
              conversationId={conversationId}
              recipientId={product.seller_id}
              recipientName={product.profiles?.full_name || "Seller"}
              productTitle={product.title}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}