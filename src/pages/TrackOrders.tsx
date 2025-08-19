import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, Truck, CheckCircle, Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ClearTrackingHistory } from '@/components/products/ClearTrackingHistory';
import { SecureDownloadButton } from '@/components/products/SecureDownloadButton';

interface Order {
  id: string;
  tracking_number?: string;
  status: string;
  amount: number;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  product: {
    title: string;
    image_url?: string;
    product_type: string;
  };
}

export default function TrackOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTracking, setSearchTracking] = useState('');
  const [searchResult, setSearchResult] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(title, image_url, product_type)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchByTracking = async () => {
    if (!searchTracking.trim()) {
      toast({
        title: "Please enter a tracking number",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(title, image_url, product_type)
        `)
        .eq('tracking_number', searchTracking.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Tracking number not found",
            description: "Please check your tracking number and try again.",
            variant: "destructive",
          });
          setSearchResult(null);
          return;
        }
        throw error;
      }

      setSearchResult(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {order.product.image_url && (
              <img
                src={order.product.image_url}
                alt={order.product.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-medium">{order.product.title}</h3>
              <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
              {order.tracking_number && (
                <p className="text-sm text-muted-foreground">Tracking: {order.tracking_number}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Ordered: {new Date(order.created_at).toLocaleDateString()}
              </p>
              {order.shipped_at && (
                <p className="text-xs text-muted-foreground">
                  Shipped: {new Date(order.shipped_at).toLocaleDateString()}
                </p>
              )}
              {order.delivered_at && (
                <p className="text-xs text-muted-foreground">
                  Delivered: {new Date(order.delivered_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">₦{order.amount.toLocaleString()}</p>
            <div className="flex items-center justify-end gap-2 mt-2">
              <Badge variant={getStatusColor(order.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(order.status)}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </Badge>
              {order.product.product_type === 'digital' && 
               (order.status === 'completed' || order.status === 'delivered') && (
                <SecureDownloadButton 
                  orderId={order.id}
                  productTitle={order.product.title}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
            <p className="text-muted-foreground">Please sign in to track your orders</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Track Your Orders</h1>
          <p className="text-muted-foreground">Monitor your purchases and shipping status</p>
        </div>
        
        <div className="mb-8">
          <ClearTrackingHistory />
        </div>

        <Tabs defaultValue="my-orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-orders">My Orders</TabsTrigger>
            <TabsTrigger value="track-by-number">Track by Number</TabsTrigger>
          </TabsList>

          <TabsContent value="my-orders" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Orders Found</h3>
                  <p className="text-muted-foreground">You haven't made any purchases yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="track-by-number" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Track by Tracking Number</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter tracking number (e.g., TDW1234567890)"
                    value={searchTracking}
                    onChange={(e) => setSearchTracking(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={searchByTracking}>
                    <Search className="h-4 w-4 mr-2" />
                    Track
                  </Button>
                </div>

                {searchResult && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Tracking Result</h3>
                    <OrderCard order={searchResult} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}