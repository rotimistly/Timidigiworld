import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, Package, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface ProductFormProps {
  onSuccess?: () => void;
}

export function ProductForm({ onSuccess }: ProductFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productUrl, setProductUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    product_type: 'digital',
    shipping_required: false,
    shipping_cost: '',
    weight: ''
  });

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleProductFileUpload = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `files/${user?.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      let fileUrl = null;

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      if (formData.product_type === 'digital') {
        if (productFile) {
          fileUrl = await handleProductFileUpload(productFile);
        } else if (productUrl) {
          fileUrl = productUrl;
        }
      }

      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        product_type: formData.product_type,
        image_url: imageUrl,
        file_url: fileUrl,
        seller_id: user.id,
        shipping_required: formData.product_type === 'physical' ? formData.shipping_required : false,
        shipping_cost: formData.product_type === 'physical' && formData.shipping_cost 
          ? parseFloat(formData.shipping_cost) : 0,
        weight: formData.product_type === 'physical' && formData.weight 
          ? parseFloat(formData.weight) : null,
        status: 'active'
      };

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product created successfully!",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        category: '',
        product_type: 'digital',
        shipping_required: false,
        shipping_cost: '',
        weight: ''
      });
      setImageFile(null);
      setProductFile(null);
      setProductUrl('');

      if (onSuccess) onSuccess();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Add New Product
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Product Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter product title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your product..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="e.g., Software, eBooks, Templates"
              />
            </div>
            
            <div>
              <Label htmlFor="product_type">Product Type</Label>
              <Select 
                value={formData.product_type} 
                onValueChange={(value) => setFormData({...formData, product_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Digital Product
                    </div>
                  </SelectItem>
                  <SelectItem value="physical">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Physical Product
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.product_type === 'physical' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-medium">Physical Product Settings</h3>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="shipping_required"
                  checked={formData.shipping_required}
                  onCheckedChange={(checked) => setFormData({...formData, shipping_required: checked})}
                />
                <Label htmlFor="shipping_required">Requires Shipping</Label>
              </div>
              
              {formData.shipping_required && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping_cost">Shipping Cost (USD)</Label>
                    <Input
                      id="shipping_cost"
                      type="number"
                      step="0.01"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({...formData, shipping_cost: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image">Product Image</Label>
              <div className="mt-1">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            
            {formData.product_type === 'digital' && (
              <div>
                <Label>Digital Product Content</Label>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="productUrl" className="text-sm">Product URL/Link</Label>
                    <Input
                      id="productUrl"
                      type="url"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://example.com/your-product or direct download link"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct link to your product (eBook, video, course, etc.)
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">OR</span>
                  </div>
                  
                  <div>
                    <Label htmlFor="file" className="text-sm">Upload Product File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx,.zip,.rar,.psd,.ai,.sketch,.fig,.mp4,.mov,.mp3,.wav"
                      onChange={(e) => {
                        setProductFile(e.target.files?.[0] || null);
                        if (e.target.files?.[0]) setProductUrl(''); // Clear URL if file is selected
                      }}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload files: PDF, DOC, ZIP, PSD, AI, Sketch, Video, Audio (Max 50MB)
                    </p>
                  </div>
                  
                  {productFile && (
                    <div className="p-2 bg-muted/50 rounded text-sm">
                      Selected: {productFile.name} ({(productFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                  
                  {productUrl && (
                    <div className="p-2 bg-muted/50 rounded text-sm">
                      Product Link: {productUrl}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Product...' : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}