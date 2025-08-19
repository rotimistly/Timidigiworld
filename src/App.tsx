import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import Dashboard from "./pages/Dashboard";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProfile from "./pages/SellerProfile";
import TrackOrders from "./pages/TrackOrders";
import PaymentSuccess from "./pages/PaymentSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import BookMarketplace from "./pages/BookMarketplace";
import NotFound from "./pages/NotFound";
import { MessageCenter } from "./components/messaging/MessageCenter";
import { SupportChat } from "./components/support/SupportChat";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminProtectedRoute } from "./components/auth/AdminProtectedRoute";
import AdminAuth from "./pages/AdminAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/auth" element={
            <ProtectedRoute requireAuth={false}>
              <Auth />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/seller-dashboard" element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/seller-profile" element={
            <ProtectedRoute>
              <SellerProfile />
            </ProtectedRoute>
          } />
          <Route path="/track-orders" element={
            <ProtectedRoute>
              <TrackOrders />
            </ProtectedRoute>
          } />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/admin-auth" element={<AdminAuth />} />
          <Route path="/admin-dashboard" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <MessageCenter />
            </ProtectedRoute>
          } />
          <Route path="/books" element={
            <ProtectedRoute>
              <BookMarketplace />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SupportChat />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
