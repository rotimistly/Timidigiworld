import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference) {
      verifyPayment();
    } else {
      setError('Payment reference not found');
      setIsVerifying(false);
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: { reference }
      });

      if (error) throw error;

      if (data?.success) {
        setVerificationResult(data);
        toast({
          title: "Payment Successful!",
          description: "Your order has been confirmed and processed.",
        });
      } else {
        throw new Error(data?.error || 'Payment verification failed');
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Payment Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-destructive">Payment Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              <Link to="/products">
                <Button className="w-full">Browse Products</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = verificationResult?.order || verificationResult;
  const product = order?.product || {};
  const isDigital = product?.product_type === 'digital';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">{product?.title || 'Your Order'}</h3>
            <p className="text-2xl font-bold text-primary">
              ₦{order?.amount ? (order.amount * 1600).toLocaleString() : 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">Reference: {reference}</p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What's Next?</h4>
            {isDigital ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Payment confirmed</p>
                <p>✓ Digital product email sent</p>
                <p>✓ Check your inbox for download link</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Payment confirmed</p>
                <p>✓ Order is being processed</p>
                <p>✓ You'll receive tracking info soon</p>
                {order?.tracking_number && (
                  <p>📦 Tracking: {order.tracking_number}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Link to="/dashboard">
              <Button className="w-full">
                View Order Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}