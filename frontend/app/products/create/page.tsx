'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Image, Leaf } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: '',
    unit: 'KG',
    price: '',
    location: '',
    imageUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price: parseFloat(formData.price),
        location: formData.location,
        imageUrl: formData.imageUrl || undefined,
      };

      await api.post('/products', data);
      toast.success('Product listed successfully!');
      router.push('/products/my');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to list product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user is not a farmer, redirect
  if (user && user.role !== 'FARMER') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only farmers can list products.</p>
        <Link href="/dashboard">
          <Button className="mt-4">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['FARMER']}>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/products/my" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">List New Product</h1>
              <p className="text-muted-foreground">Add your agricultural products to the marketplace</p>
            </div>
          </div>

          <Card className="border-0 shadow-md">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>
                  Fill in the information below to list your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Organic Coffee Beans"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Coffee">Coffee</SelectItem>
                      <SelectItem value="Teff">Teff</SelectItem>
                      <SelectItem value="Wheat">Wheat</SelectItem>
                      <SelectItem value="Barley">Barley</SelectItem>
                      <SelectItem value="Vegetables">Vegetables</SelectItem>
                      <SelectItem value="Fruits">Fruits</SelectItem>
                      <SelectItem value="Livestock">Livestock</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your product (quality, harvest date, etc.)"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      placeholder="100"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => handleSelectChange('unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KG">Kilogram (KG)</SelectItem>
                        <SelectItem value="QUINTAL">Quintal</SelectItem>
                        <SelectItem value="TON">Ton</SelectItem>
                        <SelectItem value="BUNDLE">Bundle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price and Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Unit (ETB) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="1200"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Oromia"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Provide a URL to an image of your product (optional)
                  </p>
                </div>

                {/* Preview */}
                {formData.imageUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Image Preview:</p>
                    <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden border">
                      <img
                        src={formData.imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).alt = 'Invalid image URL';
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-3 border-t pt-6">
                <Link href="/products/my" className="flex-1">
                  <Button variant="outline" className="w-full">Cancel</Button>
                </Link>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Listing...' : 'List Product'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}