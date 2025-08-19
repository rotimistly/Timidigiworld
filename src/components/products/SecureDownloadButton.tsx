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

      // Create a secure download link that opens in a new tab
      const downloadWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (downloadWindow) {
        downloadWindow.location.href = file_url;
        toast.success("Download started!");
      } else {
        // Fallback for popup blockers
        window.location.href = file_url;
      }

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