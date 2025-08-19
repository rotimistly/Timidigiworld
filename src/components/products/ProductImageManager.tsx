import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProductImageManagerProps {
  productId: string;
  currentImages: string[];
  onImagesUpdate: (images: string[]) => void;
}

export function ProductImageManager({ productId, currentImages, onImagesUpdate }: ProductImageManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${productId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      const updatedImages = [...currentImages, publicUrl];
      
      // Update product with new image
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId);

      if (updateError) throw updateError;

      onImagesUpdate(updatedImages);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUrlAdd = async () => {
    if (!imageUrl.trim()) return;

    try {
      const updatedImages = [...currentImages, imageUrl];
      
      // Update product with new image URL
      const { error } = await supabase
        .from('products')
        .update({ image_url: imageUrl })
        .eq('id', productId);

      if (error) throw error;

      onImagesUpdate(updatedImages);
      setImageUrl('');
      
      toast({
        title: "Success",
        description: "Image URL added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add image URL",
        variant: "destructive",
      });
    }
  };

  const handleImageRemove = async (imageToRemove: string) => {
    try {
      const updatedImages = currentImages.filter(img => img !== imageToRemove);
      
      // Update product - if removing the current image, set to first remaining or null
      const newMainImage = updatedImages[0] || null;
      const { error } = await supabase
        .from('products')
        .update({ image_url: newMainImage })
        .eq('id', productId);

      if (error) throw error;

      onImagesUpdate(updatedImages);
      
      toast({
        title: "Success",
        description: "Image removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Product Images
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="image-upload">Upload Image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              disabled={uploading}
              className="mt-1"
            />
          </div>
          
          <div className="text-center text-muted-foreground">OR</div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleImageUrlAdd} disabled={!imageUrl.trim()}>
              Add URL
            </Button>
          </div>
        </div>

        {/* Current Images */}
        {currentImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Current Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(image, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleImageRemove(image)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Main
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          • First image will be used as the main product image
          • Supported formats: JPG, PNG, WebP, GIF
          • Recommended size: 800x600px or higher
        </p>
      </CardContent>
    </Card>
  );
}