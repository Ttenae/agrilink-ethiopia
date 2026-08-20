'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Truck, RefreshCw, ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  product: { name: string };
  buyer: { name: string };
  farmer: { name: string };
  deliveryStatus: string;
  status: string;
}

export default function UpdateDeliveryStatusPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMyDeliveries();
  }, []);

  const fetchMyDeliveries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transport/my-deliveries');
      
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
      console.error('Failed to fetch deliveries:', error);
      toast.error('Failed to load your deliveries');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !status) {
      toast.error('Please select an order and status');
      return;
    }

    setUpdating(true);
    try {
      await api.patch(`/transport/deliveries/${selectedOrder}/status`, {
        status,
        notes,
      });
      
      toast.success(`Delivery status updated to ${status}`);
      setSelectedOrder('');
      setStatus('');
      setNotes('');
      
      // Refresh the list
      await fetchMyDeliveries();
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/transport/my-deliveries');
      }, 1000);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const statusOptions = [
    { value: 'PICKED_UP', label: 'Picked Up' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'FAILED', label: 'Failed' },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      PENDING: { label: 'Pending', icon: RefreshCw, className: 'bg-yellow-100 text-yellow-700' },
      ASSIGNED: { label: 'Assigned', icon: RefreshCw, className: 'bg-blue-100 text-blue-700' },
      PICKED_UP: { label: 'Picked Up', icon: Truck, className: 'bg-purple-100 text-purple-700' },
      IN_TRANSIT: { label: 'In Transit', icon: Truck, className: 'bg-indigo-100 text-indigo-700' },
      DELIVERED: { label: 'Delivered', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
      FAILED: { label: 'Failed', icon: XCircle, className: 'bg-red-100 text-red-700' },
    };

    const info = statusMap[status] || statusMap.PENDING;
    const Icon = info.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${info.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </span>
    );
  };

  const selectedOrderData = orders.find(o => o.id === selectedOrder);
  const currentStatus = selectedOrderData?.deliveryStatus || '';

  const getNextStatuses = (current: string): string[] => {
    const transitions: Record<string, string[]> = {
      ASSIGNED: ['PICKED_UP'],
      PICKED_UP: ['IN_TRANSIT'],
      IN_TRANSIT: ['DELIVERED', 'FAILED'],
      PENDING: ['ASSIGNED'],
      DELIVERED: [],
      FAILED: [],
    };
    return transitions[current] || [];
  };

  const nextStatuses = getNextStatuses(currentStatus);
  const isComplete = currentStatus === 'DELIVERED' || currentStatus === 'FAILED';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading your deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md">
          <Link
            href="/transport/my-deliveries"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Deliveries
          </Link>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <CardTitle>Update Delivery Status</CardTitle>
              </div>
              <CardDescription>
                Update the status of your assigned deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No deliveries assigned to you.</p>
                  <Link href="/transport/available">
                    <Button variant="link" className="mt-2">
                      Find available orders
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="order">Select Order</Label>
                    <Select 
                      value={selectedOrder} 
                      onValueChange={(value) => {
                        setSelectedOrder(value);
                        setStatus(''); // Reset status when order changes
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose an order" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.product.name} - {order.buyer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedOrderData && (
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <span className="text-muted-foreground">Current status:</span>
                        {getStatusBadge(currentStatus)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">New Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={isComplete ? "Delivery complete" : "Select new status"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isComplete ? (
                          <SelectItem value="none" disabled>
                            ✓ Delivery already {currentStatus.toLowerCase()}
                          </SelectItem>
                        ) : nextStatuses.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No updates available
                          </SelectItem>
                        ) : (
                          statusOptions
                            .filter(opt => nextStatuses.includes(opt.value))
                            .map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    {!isComplete && nextStatuses.length === 0 && currentStatus && (
                      <p className="text-sm text-amber-600 mt-1">
                        ⚠️ No status updates available for this order.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes about the delivery (e.g., delivery proof, issues encountered)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updating || !selectedOrder || !status || isComplete}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : isComplete ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Delivery Complete
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Status
                      </>
                    )}
                  </Button>

                  {isComplete && (
                    <p className="text-sm text-green-600 text-center">
                      ✅ This delivery is already complete. No further updates needed.
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}