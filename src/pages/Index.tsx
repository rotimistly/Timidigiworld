import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Download, ShoppingBag, Users, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  status: string;
  product_type: string;
  seller_id: string;
  shipping_cost?: number;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles!seller_id(full_name, avatar_url)
        `)
        .eq('status', 'active')
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to add products to cart.",
      });
      return;
    }
    
    toast({
      title: "Added to cart!",
      description: "Product has been added to your cart.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to <span className="text-primary">TimiDigiWorld</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your trusted digital marketplace for buying and selling digital products from anywhere. 
            Discover amazing digital content or start selling your own creations today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="w-full sm:w-auto">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Browse Products
              </Button>
            </Link>
            <Link to={user ? "/seller-dashboard" : "/auth"}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Download className="h-5 w-5 mr-2" />
                Start Selling
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose TimiDigiWorld?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-muted-foreground">
                Your transactions and data are protected with industry-leading security measures.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Community</h3>
              <p className="text-muted-foreground">
                Connect with creators and buyers from around the world in our vibrant marketplace.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Download</h3>
              <p className="text-muted-foreground">
                Get instant access to your digital products with our seamless download system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link to="/products">
              <Button variant="outline">
                View All Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No featured products available yet.</p>
              {user && (
                <Link to="/seller-dashboard">
                  <Button>Be the first to sell!</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Digital Business?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join thousands of creators who are already earning from their digital products.
          </p>
          <Link to={user ? "/seller-dashboard" : "/auth"}>
            <Button variant="secondary" size="lg">
              Start Selling Today
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
