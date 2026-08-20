'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  ShoppingCart,
  Leaf,
  CreditCard,
  MessageCircle,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    name: string;
    phone: string;
  };
  farmer: {
    id: string;
    name: string;
    phone: string;
  };
  product: {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    unit: string;
    imageUrl: string | null;
    location: string;
  };
  payment: {
    id: string;
    amount: number;
    commissionAmount: number;
    status: string;
    createdAt: string;
  } | null;
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    buyer: {
      name: string;
    };
  } | null;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Get the ID from params - MUST be lowercase 'id'
  const id = params?.ID as string;

  useEffect(() => {
    if (id) {
      console.log('Order ID:', id);
      fetchOrder(id);
    } else {
      console.error('No order ID found in params:', params);
      toast.error('Order ID is missing');
      router.push('/orders');
    }
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Order not found');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success(`Order ${status.toLowerCase()} successfully`);
      fetchOrder(id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      PENDING: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      },
      ACCEPTED: {
        label: 'Accepted',
        icon: CheckCircle2,
        className: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      REJECTED: {
        label: 'Rejected',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-200'
      },
      COMPLETED: {
        label: 'Completed',
        icon: Truck,
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      CANCELLED: {
        label: 'Cancelled',
        icon: XCircle,
        className: 'bg-gray-100 text-gray-700 border-gray-200'
      }
    };

    const info = statusMap[status] || statusMap.PENDING;
    const Icon = info.icon;

    return (
      <Badge variant="outline" className={info.className}>
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      },
      PAID: {
        label: 'Paid',
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      FAILED: {
        label: 'Failed',
        className: 'bg-red-100 text-red-700 border-red-200'
      }
    };

    const info = statusMap[status] || statusMap.PENDING;

    return (
      <Badge variant="outline" className={info.className}>
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusActions = () => {
    if (!user || !order) return null;

    const isFarmer = user.role === 'FARMER' && order.farmer.id === user.id;
    const isBuyer = user.role === 'BUYER' && order.buyer.id === user.id;
    const isAdmin = user.role === 'ADMIN';

    const actions = [];

    if (isFarmer && order.status === 'PENDING') {
      actions.push(
        <Button
          key="accept"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleUpdateStatus('ACCEPTED')}
          disabled={updating}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Accept Order
        </Button>,
        <Button
          key="reject"
          variant="destructive"
          onClick={() => handleUpdateStatus('REJECTED')}
          disabled={updating}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject Order
        </Button>
      );
    }

    if (isFarmer && order.status === 'ACCEPTED') {
      actions.push(
        <Button
          key="complete"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => handleUpdateStatus('COMPLETED')}
          disabled={updating}
        >
          <Truck className="h-4 w-4 mr-2" />
          Mark as Completed
        </Button>
      );
    }

    if (isBuyer && (order.status === 'PENDING' || order.status === 'ACCEPTED')) {
      actions.push(
        <Button
          key="cancel"
          variant="destructive"
          onClick={() => handleUpdateStatus('CANCELLED')}
          disabled={updating}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancel Order
        </Button>
      );
    }

    return actions.length > 0 ? actions : null;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-muted-foreground">The order you're looking for doesn't exist.</p>
        <Link href="/orders">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/orders" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
              <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Status */}
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(order.status)}
                <span className="text-sm text-muted-foreground">
                  Updated {formatDate(order.updatedAt)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {getStatusActions()}
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card className="mb-6 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="h-24 w-24 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {order.product.imageUrl ? (
                    <img
                      src={order.product.imageUrl}
                      alt={order.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${order.product.id}`}>
                    <h3 className="font-semibold hover:text-primary transition-colors">
                      {order.product.name}
                    </h3>
                  </Link>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Category: {order.product.category}</p>
                    <p>Location: {order.product.location}</p>
                    <p className="flex items-center gap-2">
                      <span>Price: {formatPrice(order.product.price)} / {order.product.unit}</span>
                      <span>•</span>
                      <span>Quantity: {order.quantity} {order.product.unit}</span>
                    </p>
                  </div>
                  <div className="mt-2">
                    <span className="font-semibold text-lg text-primary">
                      Total: {formatPrice(order.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
              {order.product.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {order.product.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          {order.payment && (
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payment & Commission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Total</p>
                    <p className="font-semibold">{formatPrice(order.payment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commission (3%)</p>
                    <p className="font-semibold text-amber-600">
                      {formatPrice(order.payment.commissionAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getPaymentStatusBadge(order.payment.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Buyer & Farmer Info */}
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Buyer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{order.buyer.name}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {order.buyer.phone}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Farmer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{order.farmer.name}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {order.farmer.phone}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {order.product.location}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Review */}
          {order.review && (
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (order.review?.rating || 0)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    by {order.review?.buyer?.name || 'User'}
                  </span>
                </div>
                {order.review?.comment && (
                  <p className="text-sm text-muted-foreground">
                    {order.review.comment}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimelineItem
                  label="Order Placed"
                  date={order.createdAt}
                  icon={<ShoppingCart className="h-4 w-4" />}
                />
                {order.status !== 'PENDING' && (
                  <TimelineItem
                    label={`Order ${order.status.toLowerCase()}`}
                    date={order.updatedAt}
                    icon={
                      order.status === 'ACCEPTED' ? <CheckCircle2 className="h-4 w-4" /> :
                      order.status === 'COMPLETED' ? <Truck className="h-4 w-4" /> :
                      order.status === 'REJECTED' ? <XCircle className="h-4 w-4" /> :
                      order.status === 'CANCELLED' ? <XCircle className="h-4 w-4" /> :
                      <Clock className="h-4 w-4" />
                    }
                  />
                )}
                {order.status === 'COMPLETED' && order.payment && (
                  <TimelineItem
                    label="Commission Generated"
                    date={order.payment.createdAt}
                    icon={<CreditCard className="h-4 w-4" />}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface TimelineItemProps {
  label: string;
  date: string;
  icon: React.ReactNode;
}

const TimelineItem = ({ label, date, icon }: TimelineItemProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
      </div>
    </div>
  );
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};