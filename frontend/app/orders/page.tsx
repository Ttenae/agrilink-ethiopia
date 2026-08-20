'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Package, 
  Eye, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Truck,
  Leaf,
  Calendar,
  ArrowRight,
  MapPin,
  User,
  Phone,
  Route,
  CreditCard,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  paymentStatus?: string;
  deliveryStatus: string;
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
  transporter: {
    id: string;
    name: string;
    phone: string;
    transporterProfile: {
      vehicleType: string;
      licensePlate: string;
    };
  } | null;
  product: {
    id: string;
    name: string;
    category: string;
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
  } | null;
  review: {
    id: string;
    rating: number;
  } | null;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'buyer' | 'farmer' | 'all'>(
    user?.role === 'FARMER' ? 'farmer' : user?.role === 'BUYER' ? 'buyer' : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [view]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let response;
      if (view === 'buyer' && user) {
        response = await api.get('/orders/buyer');
      } else if (view === 'farmer' && user) {
        response = await api.get('/orders/farmer');
      } else if (user?.role === 'ADMIN') {
        response = await api.get('/orders');
      } else {
        setOrders([]);
        setLoading(false);
        return;
      }
      
      const orderData = response?.data?.data || response?.data || response || [];
      setOrders(orderData);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
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

  const getDeliveryStatusBadge = (status: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      PENDING: {
        label: 'Pending Assignment',
        icon: Clock,
        className: 'bg-gray-100 text-gray-700 border-gray-200'
      },
      ASSIGNED: {
        label: 'Transporter Assigned',
        icon: User,
        className: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      PICKED_UP: {
        label: 'Picked Up',
        icon: Truck,
        className: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      IN_TRANSIT: {
        label: 'In Transit',
        icon: Route,
        className: 'bg-indigo-100 text-indigo-700 border-indigo-200'
      },
      DELIVERED: {
        label: 'Delivered! 🎉',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      FAILED: {
        label: 'Delivery Failed',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-200'
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

  const getDeliveryStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: 'Waiting for transporter assignment...',
      ASSIGNED: 'A transporter has been assigned to your order.',
      PICKED_UP: 'Your order has been picked up by the transporter!',
      IN_TRANSIT: 'Your order is on the way! 🚚',
      DELIVERED: 'Your order has been delivered! 🎉',
      FAILED: 'Delivery failed. Please contact support.'
    };
    return texts[status] || 'Status unknown';
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
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
              <p className="text-muted-foreground">
                {view === 'buyer' ? 'Your purchased orders' : view === 'farmer' ? 'Orders for your products' : 'All orders'}
              </p>
            </div>
            {user && (
              <div className="flex gap-2">
                {user.role === 'BUYER' && (
                  <Button
                    variant={view === 'buyer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('buyer')}
                  >
                    My Orders
                  </Button>
                )}
                {user.role === 'FARMER' && (
                  <Button
                    variant={view === 'farmer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('farmer')}
                  >
                    Incoming Orders
                  </Button>
                )}
                {user.role === 'ADMIN' && (
                  <Button
                    variant={view === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('all')}
                  >
                    All Orders
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 px-4 py-1.5"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Badge>
            <Badge
              variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 px-4 py-1.5"
              onClick={() => setStatusFilter('PENDING')}
            >
              Pending
            </Badge>
            <Badge
              variant={statusFilter === 'ACCEPTED' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 px-4 py-1.5"
              onClick={() => setStatusFilter('ACCEPTED')}
            >
              Accepted
            </Badge>
            <Badge
              variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 px-4 py-1.5"
              onClick={() => setStatusFilter('COMPLETED')}
            >
              Completed
            </Badge>
            <Badge
              variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 px-4 py-1.5"
              onClick={() => setStatusFilter('REJECTED')}
            >
              Rejected
            </Badge>
            <Badge
              variant={statusFilter === 'CANCELLED' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 px-4 py-1.5"
              onClick={() => setStatusFilter('CANCELLED')}
            >
              Cancelled
            </Badge>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No orders found</h3>
              <p className="text-muted-foreground">
                {view === 'buyer' 
                  ? 'You haven\'t placed any orders yet. Browse products to get started.' 
                  : view === 'farmer'
                  ? 'No orders have been placed for your products yet.'
                  : 'No orders in the system.'}
              </p>
              {(view === 'buyer' || !user) && (
                <Link href="/products">
                  <Button className="mt-4">
                    Browse Products
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  userRole={user?.role || ''}
                  onOrderDeleted={fetchOrders}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface OrderCardProps {
  order: Order;
  userRole: string;
  onOrderDeleted: () => void;
}

const OrderCard = ({ order, userRole, onOrderDeleted }: OrderCardProps) => {
  const [deleting, setDeleting] = useState(false);

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

  const getDeliveryStatusBadge = (status: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      PENDING: {
        label: 'Pending Assignment',
        icon: Clock,
        className: 'bg-gray-100 text-gray-700 border-gray-200'
      },
      ASSIGNED: {
        label: 'Transporter Assigned',
        icon: User,
        className: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      PICKED_UP: {
        label: 'Picked Up',
        icon: Truck,
        className: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      IN_TRANSIT: {
        label: 'In Transit',
        icon: Route,
        className: 'bg-indigo-100 text-indigo-700 border-indigo-200'
      },
      DELIVERED: {
        label: 'Delivered! 🎉',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      FAILED: {
        label: 'Delivery Failed',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-200'
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

  const getDeliveryStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: 'Waiting for transporter assignment...',
      ASSIGNED: 'A transporter has been assigned to your order.',
      PICKED_UP: 'Your order has been picked up by the transporter!',
      IN_TRANSIT: 'Your order is on the way! 🚚',
      DELIVERED: 'Your order has been delivered! 🎉',
      FAILED: 'Delivery failed. Please contact support.'
    };
    return texts[status] || 'Status unknown';
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
      month: 'short',
      day: 'numeric',
    });
  };

  const isBuyer = userRole === 'BUYER';
  const isFarmer = userRole === 'FARMER';
  const isAdmin = userRole === 'ADMIN';

  // ✅ Pay Now button shows when:
  // 1. User is BUYER
  // 2. Order status is ACCEPTED (farmer accepted)
  // 3. Payment status is NOT PAID yet
  const showPayNow = isBuyer && order.status === 'ACCEPTED' && order.paymentStatus !== 'PAID';

  // ✅ Delete button shows for:
  // 1. Admin can delete any order
  // 2. Buyer can delete their own PENDING orders (before farmer accepts)
  // 3. Farmer can delete orders for their products if PENDING
  const showDelete = isAdmin || 
    (isBuyer && order.status === 'PENDING') || 
    (isFarmer && order.status === 'PENDING');

  const handleDeleteOrder = async () => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/orders/${order.id}`);
      toast.success('Order deleted successfully');
      onOrderDeleted();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      toast.error(error.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Product Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {getStatusBadge(order.status)}
              {order.deliveryStatus && isBuyer && getDeliveryStatusBadge(order.deliveryStatus)}
              {order.paymentStatus && (
                <Badge variant="outline" className={order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending Payment'}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold">{order.product.name}</h3>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {order.quantity} × {formatPrice(order.product.price)} = {formatPrice(order.totalPrice)}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {order.product.location}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {isBuyer ? `Farmer: ${order.farmer.name}` : `Buyer: ${order.buyer.name}`}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(order.createdAt)}
              </div>
              
              {/* Delivery Status for Buyer */}
              {isBuyer && order.deliveryStatus && (
                <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium">📦 Delivery Status</p>
                  <p className="text-sm text-muted-foreground">
                    {getDeliveryStatusText(order.deliveryStatus)}
                  </p>
                  {order.transporter && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      <p>🚚 Transporter: {order.transporter.name}</p>
                      <p>📞 {order.transporter.phone}</p>
                      {order.transporter.transporterProfile && (
                        <p>🚗 {order.transporter.transporterProfile.vehicleType} - {order.transporter.transporterProfile.licensePlate}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 min-w-[120px]">
            {/* Pay Now button - only shows when status is ACCEPTED and not paid */}
            {showPayNow && (
              <Link href={`/payment/checkout?orderId=${order.id}`}>
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Pay Now
                </Button>
              </Link>
            )}
            
            {order.status === 'PENDING' && isBuyer && (
              <Badge className="bg-yellow-100 text-yellow-700 justify-center py-1.5">
                Waiting for farmer to accept...
              </Badge>
            )}
            
            <Link href={`/orders/${order.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
            </Link>

            {/* ✅ Delete Order Button */}
            {showDelete && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full"
                onClick={handleDeleteOrder}
                disabled={deleting}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};