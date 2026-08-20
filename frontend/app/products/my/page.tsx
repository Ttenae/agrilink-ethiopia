'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Leaf
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
  orders: { id: string }[];
}

export default function MyProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/farmer');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      setProducts(products.filter(p => p.id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      ACTIVE: {
        label: 'Active',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      PENDING: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      },
      INACTIVE: {
        label: 'Inactive',
        icon: AlertCircle,
        className: 'bg-gray-100 text-gray-700 border-gray-200'
      },
      SOLD: {
        label: 'Sold Out',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-200'
      }
    };

    const info = statusMap[status] || statusMap.INACTIVE;
    const Icon = info.icon;

    return (
      <Badge variant="outline" className={info.className}>
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your products...</p>
        </div>
      </div>
    );
  }

  if (user && user.role !== 'FARMER') {
    return (
      <ProtectedRoute allowedRoles={['FARMER']}>
        <div className="container mx-auto px-4 py-12 text-center">
          <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Only farmers can view this page.</p>
          <Link href="/dashboard">
            <Button className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['FARMER']}>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
              <p className="text-muted-foreground">Manage your product listings</p>
            </div>
            <Link href="/products/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                List New Product
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Products"
              value={products.length}
              icon={Package}
              color="blue"
            />
            <StatCard
              title="Active"
              value={products.filter(p => p.status === 'ACTIVE').length}
              icon={CheckCircle2}
              color="green"
            />
            <StatCard
              title="Pending"
              value={products.filter(p => p.status === 'PENDING').length}
              icon={Clock}
              color="yellow"
            />
            <StatCard
              title="Sold Out"
              value={products.filter(p => p.status === 'SOLD').length}
              icon={XCircle}
              color="red"
            />
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-muted/50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No products listed yet</h3>
              <p className="text-muted-foreground mb-4">
                Start selling your agricultural products today
              </p>
              <Link href="/products/create">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  List Your First Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  deleting={deleting === product.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  deleting: boolean;
}

const ProductCard = ({ product, onDelete, deleting }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      ACTIVE: {
        label: 'Active',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      PENDING: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      },
      INACTIVE: {
        label: 'Inactive',
        icon: AlertCircle,
        className: 'bg-gray-100 text-gray-700 border-gray-200'
      },
      SOLD: {
        label: 'Sold Out',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-200'
      }
    };

    const info = statusMap[status] || statusMap.INACTIVE;
    const Icon = info.icon;

    return (
      <Badge variant="outline" className={info.className}>
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 shadow-sm">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-video bg-muted/50 relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <Package className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            {getStatusBadge(product.status)}
          </div>
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/60 text-white border-0">
              {product.orders?.length || 0} orders
            </Badge>
          </div>
        </div>
      </Link>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Link href={`/products/${product.id}`} className="flex-1">
            <CardTitle className="text-lg hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </CardTitle>
          </Link>
        </div>
        <CardDescription className="flex items-center gap-1 text-sm">
          <span className="text-primary font-semibold">{formatPrice(product.price)}</span>
          <span className="text-muted-foreground">•</span>
          <span>{product.quantity} {product.unit}</span>
          <span className="text-muted-foreground">•</span>
          <span>{product.location}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description || 'No description provided'}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Link href={`/products/${product.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>
        <Link href={`/products/${product.id}/edit`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => onDelete(product.id)}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {deleting ? '...' : 'Delete'}
        </Button>
      </CardFooter>
    </Card>
  );
};