import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Package, DollarSign, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalEarnings: number;
  totalPurchases: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalEarnings: 0,
    totalPurchases: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user's products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user.id);

      if (productsError) throw productsError;

      // Fetch orders for user's products (as seller)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('amount, product_id')
        .in('product_id', products?.map(p => p.id) || [])
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      // Fetch user's purchases (as buyer)
      const { data: purchases, error: purchasesError } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user.id);

      if (purchasesError) throw purchasesError;

      const totalEarnings = orders?.reduce((sum, order) => sum + Number(order.amount), 0) || 0;

      setStats({
        totalProducts: products?.length || 0,
        totalOrders: orders?.length || 0,
        totalEarnings,
        totalPurchases: purchases?.length || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your TimiDigiWorld activity.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  Digital products listed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Received</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Completed sales
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  From completed orders
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Purchases</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPurchases}</div>
                <p className="text-xs text-muted-foreground">
                  Products purchased
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/sell">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <Plus className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">List New Product</h3>
                    <p className="text-sm text-muted-foreground">
                      Add a new digital product to sell
                    </p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/products">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Browse Products</h3>
                    <p className="text-sm text-muted-foreground">
                      Discover new digital products
                    </p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/profile">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <Package className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Manage Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your profile settings
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Activity Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest marketplace activity will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>No recent activity to display</p>
                <p className="text-sm mt-2">Start selling or buying to see your activity here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}