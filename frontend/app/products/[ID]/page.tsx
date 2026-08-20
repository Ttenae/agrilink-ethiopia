'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  User, 
  Phone, 
  CheckCircle2, 
  ShoppingCart,
  Calendar,
  Plus,
  Minus
} from 'lucide-react';
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
  status: string;
  createdAt: string;
  farmer: {
    id: string;
    name: string;
    phone: string;
    farmerProfile: {
      region: string;
      city: string;
      verified: boolean;
    };
  };
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);
  
  // ✅ Use params?.ID (since folder is [ID])
  const id = params?.ID as string;
  console.log('🔍 Product ID from params:', id);
  console.log('🔍 Full params:', JSON.stringify(params, null, 2));

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    } else {
      console.error('❌ Product ID is missing in params:', params);
      toast.error('Product ID is missing');
      router.push('/products');
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      console.log('📦 Fetching product with ID:', productId);
      
      if (!productId || productId === 'undefined' || productId === 'null' || productId === '') {
        console.error('❌ Invalid product ID:', productId);
        toast.error('Invalid product ID');
        router.push('/products');
        return;
      }
      
      const response = await api.get(`/products/${productId}`);
      console.log('📦 Product detail response:', response);
      
      let productData: Product | null = null;
      
      if (response && response.data) {
        if (response.data.data && typeof response.data.data === 'object' && response.data.data.id) {
          productData = response.data.data as Product;
        }
        else if (response.data.id) {
          productData = response.data as Product;
        }
      }
      
      if (!productData && response && (response as any).id) {
        productData = response as unknown as Product;
      }
      
      console.log('📦 Extracted product data:', productData);
      
      if (!productData) {
        console.warn('❌ No product data found in response:', response);
        toast.error('Product not found');
        router.push('/products');
        return;
      }
      
      setProduct(productData);
    } catch (error) {
      console.error('❌ Failed to fetch product:', error);
      toast.error('Product not found');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (value < 1) value = 1;
    if (product && value > product.quantity) {
      toast.error(`Only ${product.quantity} ${product.unit} available`);
      value = product.quantity;
    }
    setQuantity(value);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      router.push('/auth/login');
      return;
    }

    if (user.role === 'FARMER') {
      toast.error('Farmers cannot order their own products');
      return;
    }

    if (quantity > (product?.quantity || 0)) {
      toast.error(`Only ${product?.quantity} ${product?.unit} available`);
      return;
    }

    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setOrdering(true);
    try {
      const response = await api.post('/orders', {
        productId: product?.id,
        quantity: quantity,
      });
      
      const totalPrice = (product?.price || 0) * quantity;
      toast.success(`Order placed! Total: ${formatPrice(totalPrice)}`);
      router.push('/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setOrdering(false);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const increaseQuantity = () => {
    if (product && quantity < product.quantity) {
      setQuantity(quantity + 1);
    } else {
      toast.error(`Only ${product?.quantity} ${product?.unit} available`);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
        <Link href="/products">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  const isAvailable = product.status === 'ACTIVE';
  const isFarmer = user?.role === 'FARMER';
  const isOwner = user?.id === product.farmer.id;
  const totalPrice = product.price * quantity;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-square bg-white rounded-xl overflow-hidden border shadow-sm">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20">
                  <Package className="h-24 w-24 text-muted-foreground/30" />
                  <p className="text-muted-foreground mt-2">No image available</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/90 text-primary-foreground">{product.category}</Badge>
                {product.farmer.farmerProfile.verified && (
                  <Badge className="bg-green-600 text-white border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {!isAvailable && (
                  <Badge variant="destructive">Sold Out</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-2xl font-bold text-primary mt-2">
                {formatPrice(product.price)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  per {product.unit}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {product.location}
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {product.quantity} {product.unit} available
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Listed {formatDate(product.createdAt)}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {product.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{product.farmer.name}</span>
                  {product.farmer.farmerProfile.verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{product.farmer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {product.farmer.farmerProfile.city}, {product.farmer.farmerProfile.region}
                  </span>
                </div>
              </CardContent>
            </Card>

            {isAvailable && !isFarmer && !isOwner && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Place Order</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor="quantity">Quantity ({product.unit})</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={decreaseQuantity}
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              id="quantity"
                              type="number"
                              min={1}
                              max={product.quantity}
                              step={0.5}
                              value={quantity}
                              onChange={(e) => handleQuantityChange(Number(e.target.value))}
                              className="h-10 w-24 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={increaseQuantity}
                              disabled={quantity >= product.quantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.quantity} {product.unit} available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(totalPrice)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {quantity} × {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={handlePlaceOrder}
                      disabled={ordering || quantity < 1 || quantity > product.quantity}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {ordering ? 'Placing Order...' : `Order ${quantity} ${product.unit}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isFarmer && isOwner && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Edit Product
                      </Button>
                    </Link>
                    <Button variant="destructive" className="flex-1">
                      Delete Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isOwner && isFarmer && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <p>You cannot order your own products.</p>
                </CardContent>
              </Card>
            )}

            {!user && isAvailable && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground mb-4">
                    Login to place an order
                  </p>
                  <Link href="/auth/login">
                    <Button className="w-full">
                      Sign In to Order
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}