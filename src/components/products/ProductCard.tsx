import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  status: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        {product.image_url ? (
          <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
            <img 
              src={product.image_url} 
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
            <Download className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
          {product.category && (
            <Badge variant="secondary" className="shrink-0">
              {product.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <CardDescription className="line-clamp-3">
          {product.description || 'No description available'}
        </CardDescription>
        <div className="mt-4">
          <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-4 flex gap-2">
        <Link to={`/product/${product.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </Link>
        <Button onClick={handleAddToCart} className="flex-1">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}