import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OrderTracking } from '@/components/orders/OrderTracking';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.email}!
            </h1>
            <p className="text-muted-foreground">
              Manage your account and track your orders
            </p>
          </div>

          <OrderTracking />
        </div>
      </main>

      <Footer />
    </div>
  );
}