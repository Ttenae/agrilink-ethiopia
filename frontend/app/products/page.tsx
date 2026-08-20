'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Package, ShoppingCart, Leaf } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  location: string;
  imageUrl: string | null;
  farmer: {
    id: string;
    name: string;
    farmerProfile: { verified: boolean };
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      console.log('📦 Full response:', response);
      
      let productData: Product[] = [];
      
      if (response?.data?.data && Array.isArray(response.data.data)) {
        productData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        productData = response.data;
      } else if (Array.isArray(response)) {
        productData = response;
      }
      
      productData = productData.map((product, index) => {
        if (!product.id) {
          console.warn(`⚠️ Product at index ${index} has no ID, using fallback`);
          return {
            ...product,
            id: `fallback-${index}-${Date.now()}`
          };
        }
        return product;
      });
      
      console.log('📦 Processed products:', productData.map(p => ({ id: p.id, name: p.name })));
      
      setProducts(productData);
      
      if (productData.length > 0) {
        const uniqueCategories = [...new Set(productData.map((p) => p.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }
    try {
      const response = await api.get(`/products/search?q=${searchQuery}`);
      
      let productData: Product[] = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        productData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        productData = response.data;
      } else if (Array.isArray(response)) {
        productData = response;
      }
      
      productData = productData.map((product, index) => ({
        ...product,
        id: product.id || `fallback-${index}-${Date.now()}`
      }));
      
      setProducts(productData);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleCategoryFilter = async (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      fetchProducts();
      return;
    }
    try {
      const response = await api.get(`/products/category/${category}`);
      
      let productData: Product[] = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        productData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        productData = response.data;
      } else if (Array.isArray(response)) {
        productData = response;
      }
      
      productData = productData.map((product, index) => ({
        ...product,
        id: product.id || `fallback-${index}-${Date.now()}`
      }));
      
      setProducts(productData);
    } catch (error) {
      console.error('Filter failed:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // ✅ Handle navigation with ID verification
  const handleProductClick = (productId: string) => {
    console.log('🔍 Navigating to product ID:', productId);
    if (!productId) {
      console.error('❌ Cannot navigate: product ID is missing');
      toast.error('Product ID is missing');
      return;
    }
    router.push(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">Discover fresh agricultural products from verified farmers</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onProductClick={handleProductClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ ProductCard component with proper navigation
const ProductCard = ({ product, onProductClick }: { product: Product; onProductClick: (id: string) => void }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // ✅ Ensure we have a valid ID
  const productId = product?.id;
  
  console.log(`🔍 Rendering ProductCard: ID=${productId}, Name=${product.name}`);

  const handleClick = () => {
    console.log('🖱️ Product clicked, ID:', productId);
    if (productId) {
      onProductClick(productId);
    } else {
      console.error('❌ Product ID is invalid:', productId);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer" onClick={handleClick}>
      <div className="aspect-square bg-muted/50 relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {product.farmer?.farmerProfile?.verified && (
          <Badge className="absolute top-2 right-2 bg-green-600 text-white border-0">✓ Verified</Badge>
        )}
        <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground border-0">
          {product.category}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg hover:text-primary transition-colors line-clamp-1">{product.name}</CardTitle>
        <CardDescription className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3" />
          {product.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
          <span className="text-sm text-muted-foreground">{product.quantity} {product.unit}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <span>By {product.farmer?.name || 'Unknown'}</span>
          {product.farmer?.farmerProfile?.verified && <span className="text-green-600">• Verified</span>}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button className="w-full bg-primary hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};