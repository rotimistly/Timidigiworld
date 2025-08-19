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
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSecureDownload = async () => {
    setIsDownloading(true);
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

      // Create and trigger a download
      const link = document.createElement('a');
      link.href = file_url;
      link.download = `${productTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${file_url.split('.').pop() || 'file'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");

    } catch (error: any) {
      console.error('Secure download error:', error);
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleSecureDownload}
      disabled={isDownloading}
      className={className}
      size="sm"
    >
      {isDownloading ? (
        <>
          <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
          Preparing...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download {productTitle}
        </>
      )}
    </Button>
  );
};