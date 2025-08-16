import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Search, Plus, Store, Menu, Package, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TimiDigiWorld</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search digital products..."
                className="pl-10"
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <NotificationCenter />
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/seller-dashboard">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Sell Products
                  </Button>
                </Link>
                <Link to="/track-orders">
                  <Button variant="ghost" size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    Track Orders
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col space-y-4 mt-8">
                {user ? (
                  <>
                    <Link to="/dashboard" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                      <User className="h-5 w-5" />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/seller-dashboard" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                      <Plus className="h-5 w-5" />
                      <span>Sell Products</span>
                    </Link>
                    <Link to="/seller-profile" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                      <Settings className="h-5 w-5" />
                      <span>Seller Profile</span>
                    </Link>
                    <Link to="/track-orders" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                      <Package className="h-5 w-5" />
                      <span>Track Orders</span>
                    </Link>
                    <Link to="/products" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                      <ShoppingCart className="h-5 w-5" />
                      <span>Browse Products</span>
                    </Link>
                    <Button variant="outline" onClick={signOut} className="justify-start">
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}