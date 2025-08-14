import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface PaymentFormProps {
  product: {
    id: string;
    title: string;
    price: number;
    shipping_cost?: number;
  };
  onSuccess?: () => void;
}

export function PaymentForm({ product, onSuccess }: PaymentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = product.price + (product.shipping_cost || 0);

  const handlePayment = async () => {
    if (!paymentMethod || !user) return;

    setIsProcessing(true);

    try {
      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          product_id: product.id,
          amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Process payment based on method
      if (paymentMethod === 'paypal') {
        // Redirect to PayPal
        const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=Rotimistly@gmail.com&item_name=${encodeURIComponent(product.title)}&amount=${totalAmount}&currency_code=USD&return=${encodeURIComponent(window.location.origin)}/payment-success&cancel_return=${encodeURIComponent(window.location.origin)}/payment-cancel`;
        
        window.open(paypalUrl, '_blank');
      } else if (paymentMethod === 'cashapp') {
        // Show Cash App instructions
        toast({
          title: "Cash App Payment",
          description: "Please send payment to $TimiDigiWorld and include order ID in notes",
        });
      }

      if (onSuccess) onSuccess();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Payment processing failed",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Options
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-medium">Order Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{product.title}</span>
              <span>${product.price.toFixed(2)}</span>
            </div>
            {product.shipping_cost && product.shipping_cost > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>${product.shipping_cost.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Payment Method</h3>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Choose payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paypal">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  PayPal
                </div>
              </SelectItem>
              <SelectItem value="cashapp">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Cash App
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod === 'cashapp' && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Cash App Instructions</h4>
            <p className="text-sm text-muted-foreground">
              Send payment to: <strong>$TimiDigiWorld</strong>
              <br />
              Include your order details in the payment notes
            </p>
          </div>
        )}

        {paymentMethod === 'paypal' && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">PayPal Payment</h4>
            <p className="text-sm text-muted-foreground">
              You will be redirected to PayPal to complete your payment securely.
            </p>
          </div>
        )}

        <Button 
          onClick={handlePayment} 
          disabled={!paymentMethod || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Pay ${totalAmount.toFixed(2)}
            </>
          )}
        </Button>

        <div className="text-xs text-center text-muted-foreground">
          <p>Payments processed securely</p>
          <p>For support: Rotimistly@gmail.com | 08147838934</p>
        </div>
      </CardContent>
    </Card>
  );
}