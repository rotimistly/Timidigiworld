import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Package, ShoppingCart, User, ArrowLeft, CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ShareButton } from '@/components/products/ShareButton';

interface ProductWithProfiles {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  image_url?: string;
  category?: string;
  product_type: string;
  seller_id?: string;
  is_admin_product?: boolean;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductWithProfiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuestCheckout, setShowGuestCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      // Try regular products first
      let { data: productData, error } = await supabase
        .from('products')
        .select(`
          id, title, description, price, currency, image_url, category, 
          product_type, seller_id, status,
          profiles:seller_id(full_name, avatar_url)
        `)
        .eq('id', productId)
        .eq('status', 'active')
        .maybeSingle();

      if (productData) {
        setProduct({
          ...productData,
          profiles: productData.profiles as any || null
        });
        setLoading(false);
        return;
      }

      // If not found, try admin products
      const { data: adminProductData, error: adminError } = await supabase
        .from('admin_products')
        .select('*')
        .eq('id', productId)
        .eq('status', 'active')
        .maybeSingle();

      if (adminError) {
        console.error('Error fetching admin products:', adminError);
        throw new Error('Product not found');
      }

      if (!adminProductData) {
        throw new Error('Product not found');
      }

      setProduct({
        ...adminProductData,
        is_admin_product: true,
        profiles: { full_name: 'TimiDigiWorld Admin', avatar_url: null }
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Product not found or no longer available",
        variant: "destructive",
      });
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = async () => {
    if (!paymentMethod || !deliveryEmail || !product) {
      toast({
        title: "Missing Information",
        description: "Please provide all required information",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('global-payment-gateway', {
        body: {
          productId: product.id,
          paymentMethod: paymentMethod,
          amount: product.price,
          deliveryEmail: deliveryEmail,
          currency: 'NGN',
          country: 'NG',
          guestCheckout: true
        }
      });

      if (error) throw error;

      if (data?.success && data?.authorization_url) {
        window.open(data.authorization_url, '_blank');
      } else {
        throw new Error(data?.error || 'Payment initialization failed');
      }

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment processing failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-1 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="aspect-video relative bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={product.product_type === 'digital' ? 'default' : 'outline'}>
                      {product.product_type}
                    </Badge>
                    {product.category && (
                      <Badge variant="secondary">{product.category}</Badge>
                    )}
                    {product.is_admin_product && (
                      <Badge className="bg-green-600">Admin Product</Badge>
                    )}
                  </div>
                </div>
                <ShareButton 
                  productId={product.id} 
                  productTitle={product.title} 
                />
              </div>
              
              <p className="text-lg text-gray-600 mb-6">
                {product.description || "No description available"}
              </p>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {product.currency ? `${product.currency} ${product.price}` : `$${product.price}`}
                </span>
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {product.profiles?.full_name || "Unknown Seller"}
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={() => setShowGuestCheckout(true)}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Buy Now - No Account Needed
                </Button>
                
                <p className="text-sm text-center text-gray-600">
                  Click the link above to purchase without creating an account
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Checkout Modal */}
        {showGuestCheckout && (
          <Dialog open={showGuestCheckout} onOpenChange={setShowGuestCheckout}>
            <DialogContent className="max-w-md">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Quick Purchase
                  </CardTitle>
                  <CardDescription>
                    Complete your purchase without creating an account
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Order Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{product.title}</span>
                        <span>₦{(product.price * 1600).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Total</span>
                        <span>₦{(product.price * 1600).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guestEmail">Email Address</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={deliveryEmail}
                      onChange={(e) => setDeliveryEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <Label>Payment Method</Label>
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

                  <Button 
                    onClick={handleGuestCheckout} 
                    disabled={!paymentMethod || !deliveryEmail || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? 'Redirecting to Paystack...' : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pay ₦{(product.price * 1600).toLocaleString()}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Footer />
    </div>
  );
}