'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Truck,
  MapPin,
  Package,
  User,
  Phone,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface AvailableOrder {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  deliveryStatus: string;
  createdAt: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  deliveryDistance?: number;
  product: {
    id: string;
    name: string;
    category: string;
    location: string;
    imageUrl: string | null;
  };
  farmer: {
    id: string;
    name: string;
    phone: string;
  };
  buyer: {
    id: string;
    name: string;
    phone: string;
  };
  transporterRequest?: {
    id: string;
    status: string;
    estimatedFee: number;
    distance: number;
    weight: number;
    pickupAddress: string;
    dropoffAddress: string;
  } | null;
}

export default function AvailableOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableOrders();
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      setLoading(true);
      // ✅ FIXED: Use the correct endpoint for transporters
      const response = await api.get('/transport/available');
      
      if (response && Array.isArray(response)) {
        setOrders(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch available orders:', error);
      toast.error('Failed to load available orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setAccepting(orderId);
      // ✅ FIXED: Use the correct endpoint
      await api.post(`/transport/accept/${orderId}`);
      toast.success('Order accepted successfully!');
      fetchAvailableOrders();
    } catch (error: any) {
      console.error('Failed to accept order:', error);
      toast.error(error.response?.data?.message || 'Failed to accept order');
    } finally {
      setAccepting(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      PENDING: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
      ASSIGNED: { label: 'Assigned', icon: Truck, className: 'bg-blue-100 text-blue-700' },
      PICKED_UP: { label: 'Picked Up', icon: Truck, className: 'bg-purple-100 text-purple-700' },
      IN_TRANSIT: { label: 'In Transit', icon: Truck, className: 'bg-indigo-100 text-indigo-700' },
      DELIVERED: { label: 'Delivered', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
      FAILED: { label: 'Failed', icon: AlertCircle, className: 'bg-red-100 text-red-700' },
    };

    const info = statusMap[status] || statusMap.PENDING;
    const Icon = info.icon;

    return (
      <Badge className={info.className}>
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading available orders...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Available Orders</h1>
              <p className="text-muted-foreground">
                Browse orders that need delivery
              </p>
            </div>
            <Button
              variant="outline"
              onClick={fetchAvailableOrders}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {order.product?.imageUrl ? (
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">
                                {order.product?.name || 'Unknown Product'}
                              </h3>
                              {getStatusBadge(order.deliveryStatus || 'PENDING')}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.product?.location || 'Unknown location'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {order.quantity || 0} units
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatPrice(order.totalPrice || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-3">
                          <div>
                            <p className="text-muted-foreground text-xs">Farmer</p>
                            <p className="font-medium">{order.farmer?.name || 'Unknown'}</p>
                            <p className="text-muted-foreground text-xs flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.farmer?.phone || 'No phone'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Buyer</p>
                            <p className="font-medium">{order.buyer?.name || 'Unknown'}</p>
                            <p className="text-muted-foreground text-xs flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.buyer?.phone || 'No phone'}
                            </p>
                          </div>
                        </div>

                        {order.transporterRequest && (
                          <div className="flex flex-wrap items-center gap-4 text-sm bg-amber-50/50 rounded-lg p-3">
                            <div>
                              <p className="text-muted-foreground text-xs">Estimated Fee</p>
                              <p className="font-semibold text-primary">
                                {formatPrice(order.transporterRequest.estimatedFee || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Distance</p>
                              <p className="font-medium">{order.transporterRequest.distance || 0} KM</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Weight</p>
                              <p className="font-medium">{order.transporterRequest.weight || 0} KG</p>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Posted {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[120px]">
                        <Button
                          className="bg-primary hover:bg-primary/90 w-full"
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={accepting === order.id}
                        >
                          {accepting === order.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Available Orders</h3>
                <p className="text-muted-foreground">
                  There are no orders available for delivery right now.
                </p>
                <Button
                  variant="outline"
                  onClick={fetchAvailableOrders}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}