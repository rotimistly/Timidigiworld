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

      // Create and trigger direct file download with proper content handling
      try {
        // Fetch the file with proper headers to ensure content integrity
        const response = await fetch(file_url, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Determine the correct file extension and MIME type
        const contentType = response.headers.get('content-type') || blob.type;
        const urlParts = file_url.split('.');
        let extension = urlParts.length > 1 ? urlParts.pop()?.toLowerCase() : '';
        
        // If no extension from URL, determine from content type
        if (!extension) {
          if (contentType.includes('pdf')) extension = 'pdf';
          else if (contentType.includes('image/jpeg')) extension = 'jpg';
          else if (contentType.includes('image/png')) extension = 'png';
          else if (contentType.includes('image')) extension = 'jpg';
          else if (contentType.includes('video/mp4')) extension = 'mp4';
          else if (contentType.includes('video')) extension = 'mp4';
          else if (contentType.includes('audio/mpeg')) extension = 'mp3';
          else if (contentType.includes('audio')) extension = 'mp3';
          else if (contentType.includes('text')) extension = 'txt';
          else if (contentType.includes('zip')) extension = 'zip';
          else if (contentType.includes('doc')) extension = 'doc';
          else extension = 'file';
        }
        
        // Create a new blob with the correct MIME type to ensure proper viewing
        const correctedBlob = new Blob([blob], { type: contentType });
        
        // Clean filename for compatibility across devices
        const cleanTitle = productTitle
          .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .substring(0, 100); // Limit length
        
        const fileName = `${cleanTitle}.${extension}`;
        
        // Create download link
        const url = window.URL.createObjectURL(correctedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // For mobile Safari and some browsers, we need to handle differently
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          // iOS Safari handling
          link.target = '_blank';
          link.rel = 'noopener';
        }
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        toast.success(`📥 ${productTitle} downloaded successfully! Check your downloads folder.`);
        
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        
        // Enhanced fallback - try direct link approach
        try {
          const link = document.createElement('a');
          link.href = file_url;
          link.download = `${productTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.${file_url.split('.').pop() || 'file'}`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success("📱 Opening your product file...");
        } catch (fallbackError) {
          console.error('Fallback download failed:', fallbackError);
          // Last resort - open in new window
          window.open(file_url, '_blank', 'noopener,noreferrer');
          toast.error("Unable to download directly. File opened in new tab.");
        }
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