'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  MapPin, 
  Package, 
  User, 
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Route,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Order {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  deliveryStatus: string;
  createdAt: string;
  farmer: { name: string; phone: string };
  buyer: { name: string; phone: string };
  product: { name: string; unit: string; imageUrl: string | null };
}

export default function MyDeliveriesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchMyDeliveries();
  }, []);

  const fetchMyDeliveries = async () => {
    try {
      setLoading(true);
      // ✅ FIXED: Use the correct endpoint for transporters
      const response = await api.get('/transport/my-deliveries');
      
      // Handle different response structures
      let myOrders: Order[] = [];
      if (response && Array.isArray(response)) {
        myOrders = response;
      } else if (response?.data && Array.isArray(response.data)) {
        myOrders = response.data;
      } else {
        myOrders = [];
      }
      
      setOrders(myOrders);
    } catch (error) {
      console.error('Failed to fetch my deliveries:', error);
      toast.error('Failed to load your deliveries');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      // ✅ FIXED: Use the correct endpoint
      await api.patch(`/transport/deliveries/${orderId}/status`, { status });
      toast.success(`Delivery status updated to ${status}`);
      fetchMyDeliveries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      PENDING: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      },
      ASSIGNED: {
        label: 'Assigned',
        icon: Clock,
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
        label: 'Delivered',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      FAILED: {
        label: 'Failed',
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Route className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">My Deliveries</h1>
                <p className="text-muted-foreground">Track and update your assigned deliveries</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMyDeliveries}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {orders.length === 0 ? (
            <Card className="border-0 shadow-sm text-center py-12">
              <CardContent>
                <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No deliveries assigned</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You haven't been assigned any deliveries yet. Check available orders!
                </p>
                <Link href="/transport/available">
                  <Button className="mt-4">
                    Find Available Orders
                    <Truck className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getDeliveryStatusBadge(order.deliveryStatus)}
                          <Badge variant="outline" className="text-xs">
                            Order #{order.id.slice(0, 8)}
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{order.product.name}</h3>
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Buyer: {order.buyer.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Farmer: {order.farmer.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {order.quantity} units
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        {order.deliveryStatus === 'ASSIGNED' && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => updateDeliveryStatus(order.id, 'PICKED_UP')}
                            disabled={updating === order.id}
                          >
                            {updating === order.id ? 'Updating...' : 'Mark as Picked Up'}
                          </Button>
                        )}
                        {order.deliveryStatus === 'PICKED_UP' && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => updateDeliveryStatus(order.id, 'IN_TRANSIT')}
                            disabled={updating === order.id}
                          >
                            {updating === order.id ? 'Updating...' : 'Start Transit'}
                          </Button>
                        )}
                        {order.deliveryStatus === 'IN_TRANSIT' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateDeliveryStatus(order.id, 'DELIVERED')}
                              disabled={updating === order.id}
                            >
                              {updating === order.id ? 'Updating...' : 'Mark as Delivered'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateDeliveryStatus(order.id, 'FAILED')}
                              disabled={updating === order.id}
                            >
                              {updating === order.id ? 'Updating...' : 'Mark as Failed'}
                            </Button>
                          </>
                        )}
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}