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

      // Create and trigger direct file download
      try {
        // For mobile devices, we need to handle downloads differently
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          // For mobile, fetch the file and create a blob for download
          const response = await fetch(file_url);
          const blob = await response.blob();
          
          const link = document.createElement('a');
          const url = window.URL.createObjectURL(blob);
          link.href = url;
          
          // Get file extension from URL or default based on content type
          const urlParts = file_url.split('.');
          const extension = urlParts.length > 1 ? urlParts.pop() : 
                          blob.type.includes('pdf') ? 'pdf' : 
                          blob.type.includes('image') ? 'jpg' : 'file';
          
          link.download = `${productTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.${extension}`;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          window.URL.revokeObjectURL(url);
          toast.success(`${productTitle} downloaded to your device!`);
        } else {
          // For desktop, use direct download
          const link = document.createElement('a');
          link.href = file_url;
          link.download = `${productTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.${file_url.split('.').pop() || 'file'}`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`${productTitle} download started!`);
        }
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        // Fallback to opening in new tab
        window.open(file_url, '_blank', 'noopener,noreferrer');
        toast.success("Opening your product file...");
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