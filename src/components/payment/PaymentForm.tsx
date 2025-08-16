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
      // Process payment through Paystack
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          productId: product.id,
          paymentMethod: paymentMethod,
          amount: totalAmount * 1600 // Convert USD to Naira (approximate rate)
        }
      });

      if (error) throw error;

      if (data?.success && data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data?.error || 'Payment initialization failed');
      }

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment processing failed",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
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
              <span>₦{(product.price * 1600).toLocaleString()}</span>
            </div>
            {product.shipping_cost && product.shipping_cost > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>₦{(product.shipping_cost * 1600).toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>₦{(totalAmount * 1600).toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              (${totalAmount.toFixed(2)} USD)
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
              <SelectItem value="card">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credit/Debit Card
                </div>
              </SelectItem>
              <SelectItem value="bank_transfer">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bank Transfer
                </div>
              </SelectItem>
              <SelectItem value="opay">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  OPay
                </div>
              </SelectItem>
              <SelectItem value="palmpay">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  PalmPay
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Paystack Payment</h4>
            <p className="text-sm text-muted-foreground">
              You will be redirected to Paystack to complete your payment securely using {paymentMethod === 'card' ? 'your card' : paymentMethod === 'bank_transfer' ? 'bank transfer' : paymentMethod.toUpperCase()}.
              <br />
              <strong>Platform Fee:</strong> 25% goes to TimiDigiWorld, 75% to seller
            </p>
          </div>
        )}

        <Button 
          onClick={handlePayment} 
          disabled={!paymentMethod || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Redirecting to Paystack...' : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Pay ₦{(totalAmount * 1600).toLocaleString()}
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