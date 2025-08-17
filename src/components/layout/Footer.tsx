import { Link } from 'react-router-dom';
import { Store, Mail, Phone, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Store className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TimiDigiWorld</span>
            </div>
            <p className="text-muted-foreground">
              Your trusted digital marketplace for buying and selling digital products from anywhere.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link to="/products" className="text-muted-foreground hover:text-foreground">Products</Link></li>
              <li><Link to="/seller-dashboard" className="text-muted-foreground hover:text-foreground">Sell Products</Link></li>
              <li><Link to="/track-orders" className="text-muted-foreground hover:text-foreground">Track Orders</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="text-muted-foreground hover:text-foreground">Help Center</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href="mailto:Rotimistly@gmail.com" className="hover:text-foreground">
                  Rotimistly@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href="tel:08147838934" className="hover:text-foreground">
                  08147838934
                </a>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>24/7 Customer Support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p className="mb-2">&copy; {new Date().getFullYear()} TimiDigiWorld. All rights reserved. Your trusted digital marketplace.</p>
          <p>In collaboration with GoodBooks</p>
        </div>
      </div>
    </footer>
  );
}