import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Package, DollarSign, MessageSquare, Settings, Upload, Trash2 } from 'lucide-react';
import { AdminOrderManagement } from '@/components/admin/AdminOrderManagement';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
  openTickets: number;
}

interface AdminProduct {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  category: string | null;
  product_type: string;
  file_url: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
}

interface NewsUpdate {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalProducts: 0, totalRevenue: 0, openTickets: 0 });
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [newsUpdates, setNewsUpdates] = useState<NewsUpdate[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    category: '',
    product_type: 'digital',
    file_url: ''
  });

  const [newsFormData, setNewsFormData] = useState({
    title: '',
    content: '',
    type: 'announcement',
    priority: 'normal',
    is_published: false
  });

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.user_role !== 'admin') {
      // Redirect to admin auth if not admin
      window.location.href = '/admin-auth';
      return;
    }
    
    fetchAdminData();
  }; 

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const [usersResult, productsResult, ordersResult, ticketsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('amount').eq('status', 'completed'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
      ]);

      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + order.amount, 0) || 0;
      
      setStats({
        totalUsers: usersResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalRevenue,
        openTickets: ticketsResult.count || 0
      });

      // Fetch admin products
      const { data: adminProductsData } = await supabase
        .from('admin_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      setAdminProducts(adminProductsData || []);

      // Fetch news updates
      const { data: newsData } = await supabase
        .from('news_updates')
        .select('*')
        .order('created_at', { ascending: false });
      
      setNewsUpdates(newsData || []);

      // Fetch conversations
      const { data: conversationsData } = await supabase
        .from('conversations_v2')
        .select('*')
        .order('updated_at', { ascending: false });
      
      // Get messages for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          const { data: messages } = await supabase
            .from('messages_v2')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

          return {
            ...conversation,
            messages_v2: messages || []
          };
        })
      );
      
      setConversations(conversationsWithMessages);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  };

  const handleCreateProduct = async () => {
    try {
      let fileUrl = formData.file_url;
      
      if (selectedFile) {
        fileUrl = await handleFileUpload(selectedFile);
      }

      const { error } = await supabase
        .from('admin_products')
        .insert({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          currency: formData.currency,
          category: formData.category,
          product_type: formData.product_type,
          file_url: fileUrl
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin product created successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        price: '',
        currency: 'USD',
        category: '',
        product_type: 'digital',
        file_url: ''
      });
      setSelectedFile(null);
      fetchAdminData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleReplyToMessage = async (conversationId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('messages_v2')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          content,
          is_from_support: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const handleCreateNews = async () => {
    try {
      const { error } = await supabase
        .from('news_updates')
        .insert({
          title: newsFormData.title,
          content: newsFormData.content,
          type: newsFormData.type,
          priority: newsFormData.priority,
          is_published: newsFormData.is_published,
          published_at: newsFormData.is_published ? new Date().toISOString() : null,
          admin_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "News update created successfully",
      });

      setIsNewsDialogOpen(false);
      setNewsFormData({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'normal',
        is_published: false
      });
      fetchAdminData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create news update",
        variant: "destructive",
      });
    }
  };

  const handleToggleNewsPublication = async (newsId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('news_updates')
        .update({
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', newsId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `News update ${!currentStatus ? 'published' : 'unpublished'} successfully`,
      });
      
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update news status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    try {
      const { error } = await supabase
        .from('news_updates')
        .delete()
        .eq('id', newsId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "News update deleted successfully",
      });
      
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete news update",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container mx-auto p-6 space-y-6 flex-1">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add News Update
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create News Update</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="news-title">Title</Label>
                      <Input
                        id="news-title"
                        value={newsFormData.title}
                        onChange={(e) => setNewsFormData({...newsFormData, title: e.target.value})}
                        placeholder="News title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="news-type">Type</Label>
                      <Select value={newsFormData.type} onValueChange={(value) => setNewsFormData({...newsFormData, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="feature">Feature</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="news-priority">Priority</Label>
                      <Select value={newsFormData.priority} onValueChange={(value) => setNewsFormData({...newsFormData, priority: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="publish-now"
                        checked={newsFormData.is_published}
                        onChange={(e) => setNewsFormData({...newsFormData, is_published: e.target.checked})}
                      />
                      <Label htmlFor="publish-now">Publish immediately</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="news-content">Content</Label>
                    <Textarea
                      id="news-content"
                      value={newsFormData.content}
                      onChange={(e) => setNewsFormData({...newsFormData, content: e.target.value})}
                      placeholder="News content"
                      rows={6}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateNews} className="w-full">
                  Create News Update
                </Button>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin Product
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Admin Product (100% Commission)</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Product title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., ebooks, courses"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Product description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file_url">File URL</Label>
                  <Input
                    id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                    placeholder="https://example.com/file.pdf"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file_upload">Or Upload File</Label>
                  <Input
                    id="file_upload"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.zip,.mp4,.epub,.docx"
                  />
                </div>
              </div>
              <Button onClick={handleCreateProduct} className="w-full">
                Create Product
              </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTickets}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Admin Products</TabsTrigger>
            <TabsTrigger value="news">News Updates</TabsTrigger>
            <TabsTrigger value="orders">Order Management</TabsTrigger>
            <TabsTrigger value="messages">Support Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminProducts.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{product.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{product.price} {product.currency}</span>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </div>
                    {product.category && (
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newsUpdates.map((news) => (
                <Card key={news.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{news.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleNewsPublication(news.id, news.is_published)}
                        >
                          {news.is_published ? '👁️' : '👁️‍🗨️'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNews(news.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{news.content}</p>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {news.type}
                      </Badge>
                      <Badge 
                        variant={news.priority === 'urgent' ? 'destructive' : news.priority === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {news.priority}
                      </Badge>
                      <Badge variant={news.is_published ? 'default' : 'secondary'} className="text-xs">
                        {news.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    {news.published_at && (
                      <p className="text-xs text-muted-foreground">
                        Published: {new Date(news.published_at).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrderManagement />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {conversations.map((conversation) => (
              <Card key={conversation.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{conversation.subject || 'Support Conversation'}</CardTitle>
                  <Badge variant={conversation.status === 'open' ? 'destructive' : 'secondary'}>
                    {conversation.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
                    {conversation.messages_v2?.map((message: any) => (
                      <div key={message.id} className={`p-3 rounded-lg ${
                        message.is_from_support ? 'bg-primary text-primary-foreground ml-4' : 'bg-muted mr-4'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.is_from_support ? 'Support' : message.sender_email} - {new Date(message.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Type your reply..." id={`reply-${conversation.id}`} />
                    <Button onClick={() => {
                      const input = document.getElementById(`reply-${conversation.id}`) as HTMLInputElement;
                      if (input.value.trim()) {
                        handleReplyToMessage(conversation.id, input.value);
                        input.value = '';
                      }
                    }}>
                      Send Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}