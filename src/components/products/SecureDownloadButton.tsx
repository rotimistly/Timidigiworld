import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SecureDownloadButtonProps {
  orderId: string;
  productTitle: string;
  className?: string;
}

export const SecureDownloadButton = ({ orderId, productTitle, className }: SecureDownloadButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSecureDownload = async () => {
    setIsLoading(true);
    try {
      // Call secure function to get download access
      const { data, error } = await supabase.rpc('get_digital_product_access', {
        order_uuid: orderId
      });

      if (error) {
        console.error('Download access error:', error);
        toast.error("Access denied. Please ensure your order is completed.");
        return;
      }

      if (!data || data.length === 0) {
        toast.error("No download available for this order.");
        return;
      }

      const { file_url } = data[0];
      
      if (!file_url) {
        toast.error("Download file not available.");
        return;
      }

      // Open the file directly in a new window for viewing on the platform
      window.open(file_url, '_blank', 'noopener,noreferrer');
      toast.success("Opening your product file...");

    } catch (error: any) {
      console.error('Secure download error:', error);
      toast.error("Failed to access file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSecureDownload}
      disabled={isLoading}
      className={className}
      size="sm"
    >
      {isLoading ? (
        <>
          <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          View {productTitle}
        </>
      )}
    </Button>
  );
};