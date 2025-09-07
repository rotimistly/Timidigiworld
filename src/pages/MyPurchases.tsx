import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Download, Package, Star, Eye, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SecureDownloadButton } from "@/components/products/SecureDownloadButton";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface PurchasedProduct {
  order_id: string;
  product_id: string;
  product_title: string;
  product_description: string;
  product_image_url: string;
  product_type: 'digital' | 'physical';
  product_category: string;
  amount: number;
  order_status: string;
  purchase_date: string;
  tracking_number?: string;
  file_url?: string;
  seller_name?: string;
}

export default function MyPurchases() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchasedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'digital' | 'physical'>('all');

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      
      // Fetch orders with product details from both regular products and admin products
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          product_id,
          amount,
          status,
          created_at,
          tracking_number,
          products:product_id (
            title,
            description,
            image_url,
            product_type,
            category,
            file_url,
            profiles:seller_id (
              full_name
            )
          ),
          admin_products:product_id (
            title,
            description,
            image_url,
            product_type,
            category,
            file_url
          )
        `)
        .eq('buyer_id', user?.id)
        .in('status', ['paid', 'completed', 'delivered'])
        .order('created_at', { ascending: false });

      console.log('Fetching purchases for user:', user?.id);
      console.log('Orders query result:', { data: ordersData, error });

      if (error) {
        console.error('Error fetching purchases:', error);
        toast.error("Failed to load your purchases");
        return;
      }

      // Transform the data to a consistent format
      const transformedPurchases: PurchasedProduct[] = ordersData?.map(order => {
        const product = order.products || order.admin_products;
        const isAdminProduct = !!order.admin_products;
        
        return {
          order_id: order.id,
          product_id: order.product_id,
          product_title: product?.title || 'Unknown Product',
          product_description: product?.description || '',
          product_image_url: product?.image_url || '',
          product_type: (product?.product_type as 'digital' | 'physical') || 'digital',
          product_category: product?.category || 'Uncategorized',
          amount: order.amount,
          order_status: order.status,
          purchase_date: order.created_at,
          tracking_number: order.tracking_number || undefined,
          file_url: product?.file_url || undefined,
          seller_name: isAdminProduct ? 'Admin Store' : (order.products as any)?.profiles?.full_name || 'Unknown Seller'
        };
      }) || [];

      setPurchases(transformedPurchases);
    } catch (error: any) {
      console.error('Error fetching purchases:', error);
      toast.error("Failed to load your purchases");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    if (filter === 'all') return true;
    return purchase.product_type === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'delivered':
        return 'bg-blue-500';
      case 'paid':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your purchased products.
            </p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Purchased Products</h1>
          <p className="text-muted-foreground">
            View and manage all your successfully purchased products
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All Products ({purchases.length})
          </Button>
          <Button
            variant={filter === 'digital' ? 'default' : 'outline'}
            onClick={() => setFilter('digital')}
            size="sm"
          >
            Digital ({purchases.filter(p => p.product_type === 'digital').length})
          </Button>
          <Button
            variant={filter === 'physical' ? 'default' : 'outline'}
            onClick={() => setFilter('physical')}
            size="sm"
          >
            Physical ({purchases.filter(p => p.product_type === 'physical').length})
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="w-full h-48 bg-muted rounded-md"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Purchases */}
        {!isLoading && filteredPurchases.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">
                {filter === 'all' 
                  ? "No Purchases Yet"
                  : `No ${filter} products purchased`
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all'
                  ? "Start shopping to see your purchased products here!"
                  : `You haven't purchased any ${filter} products yet.`
                }
              </p>
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Purchases Grid */}
        {!isLoading && filteredPurchases.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPurchases.map((purchase) => (
              <Card key={purchase.order_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  {purchase.product_image_url && (
                    <div className="relative">
                      <img
                        src={purchase.product_image_url}
                        alt={purchase.product_title}
                        className="w-full h-48 object-cover"
                      />
                      <Badge 
                        className={`absolute top-2 right-2 ${getStatusColor(purchase.order_status)}`}
                      >
                        {purchase.order_status}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Product Title */}
                    <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">
                      {purchase.product_title}
                    </h3>

                    {/* Product Details */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        <span>Purchased {formatDate(purchase.purchase_date)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {purchase.product_type}
                        </Badge>
                        <span className="font-medium text-primary">
                          ${purchase.amount.toFixed(2)}
                        </span>
                      </div>

                      {purchase.seller_name && (
                        <div className="text-xs">
                          Sold by: {purchase.seller_name}
                        </div>
                      )}

                      {purchase.tracking_number && (
                        <div className="text-xs">
                          Tracking: {purchase.tracking_number}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {/* View Product Details */}
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full"
                      >
                        <Link to={`/products/${purchase.product_id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </Button>

                      {/* Download Button for Digital Products */}
                      {purchase.product_type === 'digital' && (
                        <SecureDownloadButton
                          orderId={purchase.order_id}
                          productTitle={purchase.product_title}
                          className="w-full"
                        />
                      )}

                      {/* Track Order for Physical Products */}
                      {purchase.product_type === 'physical' && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full"
                        >
                          <Link to="/track-orders">
                            <Package className="w-4 h-4 mr-2" />
                            Track Order
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}