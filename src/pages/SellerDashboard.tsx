import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, MessageSquare, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { ProductForm } from '@/components/seller/ProductForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function SellerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSellerData();
      
      // Enable seller mode for current user
      updateSellerStatus();
    }
  }, [user]);

  const updateSellerStatus = async () => {
    if (!user) return;
    
    await supabase
      .from('profiles')
      .update({ is_seller: true, user_role: 'seller' })
      .eq('user_id', user.id);
  };

  const fetchSellerData = async () => {
    if (!user) return;

    setIsLoading(true);
    
    // Fetch seller's products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch orders for seller's products
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        product:products!inner(*),
        buyer:profiles!inner(full_name, email)
      `)
      .eq('products.seller_id', user.id);

    // Fetch conversations where user is seller
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select(`
        *,
        product:products(*),
        buyer:profiles!conversations_buyer_id_fkey(full_name),
        messages(count)
      `)
      .eq('seller_id', user.id);

    setProducts(productsData || []);
    setOrders(ordersData || []);
    setConversations(conversationsData || []);
    setIsLoading(false);
  };

  const handleProductSuccess = () => {
    setIsDialogOpen(false);
    fetchSellerData();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });

      fetchSellerData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (productId: string) => {
    // Navigate to edit product page or open edit dialog
    toast({
      title: "Info",
      description: "Edit functionality coming soon!",
    });
  };

  const totalRevenue = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + Number(order.amount), 0);

  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const totalProducts = products.length;
  const activeChats = conversations.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Seller Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your products and sales</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <ProductForm onSuccess={handleProductSuccess} />
              </DialogContent>
            </Dialog>
            <Link to="/seller-profile">
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Manage Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold">{pendingOrders}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Chats</p>
                  <p className="text-2xl font-bold">{activeChats}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">My Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="grid gap-4">
              {products.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Products Yet</h3>
                    <p className="text-muted-foreground mb-4">Start selling by adding your first product</p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Product
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </CardContent>
                </Card>
              ) : (
                products.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h3 className="font-medium">{product.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={product.product_type === 'digital' ? 'default' : 'secondary'}>
                                {product.product_type}
                              </Badge>
                              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                {product.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                         <div className="text-right">
                           <p className="text-lg font-bold">${product.price}</p>
                           {product.category && (
                             <p className="text-sm text-muted-foreground">{product.category}</p>
                           )}
                           <div className="flex gap-2 mt-2">
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleEditProduct(product.id)}
                             >
                               Edit
                             </Button>
                             <Button
                               size="sm"
                               variant="destructive"
                               onClick={() => handleDeleteProduct(product.id)}
                             >
                               Delete
                             </Button>
                           </div>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-4">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
                    <p className="text-muted-foreground">Orders will appear here once customers start purchasing</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{order.product?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Buyer: {order.buyer?.full_name || order.buyer?.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${order.amount}</p>
                          <Badge variant={
                            order.status === 'completed' ? 'default' : 
                            order.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="grid gap-4">
              {conversations.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
                    <p className="text-muted-foreground">Customer messages will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                conversations.map((conversation) => (
                  <Card key={conversation.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">Chat with {conversation.buyer?.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            About: {conversation.product?.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conversation.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}