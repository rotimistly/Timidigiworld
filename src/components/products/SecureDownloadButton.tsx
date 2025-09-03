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
      // Use secure download function instead of direct access
      const { data, error } = await supabase.functions.invoke('secure-download', {
        body: { orderId }
      });

      if (error) {
        console.error('Secure download error:', error);
        toast.error("Access denied. Please ensure your order is completed.");
        return;
      }

      if (!data.success || !data.downloadUrl) {
        toast.error("Download not available.");
        return;
      }

      // Use the secure download URL with authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Authentication required for download.");
        return;
      }

      // Create a temporary link to trigger download
      const response = await fetch(data.downloadUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.productTitle}.${data.downloadUrl.split('.').pop() || 'file'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Download started successfully!");

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
          Download {productTitle}
        </>
      )}
    </Button>
  );
};