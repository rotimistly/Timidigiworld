import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Globe, Shield, Zap, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BookMarketplace = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Transactions',
      description: 'Safe payments via trusted gateways with buyer protection.'
    },
    {
      icon: Globe,
      title: 'Global Marketplace',
      description: 'Connect with buyers and sellers worldwide in our book community.'
    },
    {
      icon: Zap,
      title: 'Instant Access',
      description: 'Books available immediately after purchase for instant reading.'
    }
  ];

  const categories = [
    'Ebooks',
    'Online Courses', 
    'Novels',
    'Textbooks',
    'Audio Books',
    'Study Guides'
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Buy & Sell All Kinds of Books
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Discover, buy, and sell books, courses, templates, educational materials, novels, 
              and more in our comprehensive digital marketplace. Connect with readers and authors worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="https://good-newbooks.vercel.app">
                <Button size="lg" className="w-full sm:w-auto">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Book Collection
                </Button>
              </Link>
              <Link to="https://good-newbooks.vercel.app">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Start Selling Books
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Partnership Badge */}
            <div className="inline-flex items-center bg-background/80 backdrop-blur border rounded-full px-6 py-2">
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">In Strategic Partnership with GoodBooks</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Meet Our Partner: GoodBooks</h2>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    GoodBooks is a leading platform dedicated to connecting book lovers with quality literary content. 
                    Through our strategic partnership, we bring you access to an even wider selection of books and educational materials.
                  </p>
                </div>
                <div className="flex justify-center">
                  <a 
                    href="https://good-newbooks.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="lg">
                      Visit GoodBooks Platform
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Book Marketplace?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {categories.map((category, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-6 py-3 text-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Book Journey Today</h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Whether you're looking to discover your next favorite read or share your literary creations with the world, 
            our marketplace has everything you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="https://good-newbooks.vercel.app">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore Books Now
                <BookOpen className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BookMarketplace;