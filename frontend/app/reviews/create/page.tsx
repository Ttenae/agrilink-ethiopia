'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  ShoppingBag,
  User,
  Package,
  Calendar,
  ArrowLeft,
  Leaf,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Order {
  id: string;
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    imageUrl: string | null;
  };
  farmer: {
    id: string;
    name: string;
    phone: string;
  };
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  review: {
    id: string;
  } | null;
}

export default function CreateReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const fetchCompletedOrders = async () => {
    try {
      const response = await api.get('/orders/buyer');
      const completedOrders = response.data.filter(
        (order: Order) => order.status === 'COMPLETED'
      );
      setOrders(completedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order || null);
    setRating(0);
    setComment('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) {
      toast.error('Please select an order first');
      return;
    }
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        orderId: selectedOrder.id,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success('Review submitted successfully!');
      router.push('/reviews');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value: number, interactive: boolean = false) => {
    const stars = [];
    const currentRating = interactive ? hoverRating || rating : rating;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && setRating(i)}
          disabled={!interactive}
        >
          <Star
            className={`h-8 w-8 ${
              i <= currentRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const canReview = (order: Order) => {
    return order.status === 'COMPLETED' && !order.review;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  const reviewableOrders = orders.filter(canReview);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/reviews" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Write a Review</h1>
              <p className="text-muted-foreground">Share your experience with the farmer</p>
            </div>
          </div>

          {reviewableOrders.length === 0 ? (
            <Card className="border-0 shadow-sm text-center py-12">
              <CardContent>
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No orders to review</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You don't have any completed orders that need a review yet. 
                  Complete more orders to leave feedback for farmers.
                </p>
                <Link href="/products">
                  <Button className="mt-4">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Order Selection */}
              <Card className="border-0 shadow-sm h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Select an Order</CardTitle>
                  <CardDescription>
                    Choose a completed order to review
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                  {reviewableOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        selectedOrder?.id === order.id
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent hover:border-muted bg-muted/30 hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectOrder(order.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {order.product.imageUrl ? (
                            <img
                              src={order.product.imageUrl}
                              alt={order.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{order.product.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>From {order.farmer.name}</span>
                            <span>•</span>
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                              Completed
                            </Badge>
                          </div>
                        </div>
                        {order.review && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                            Reviewed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Review Form */}
              <div>
                {selectedOrder ? (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Your Review</CardTitle>
                      <CardDescription>
                        Rate your experience with {selectedOrder.farmer.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Order Summary */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{selectedOrder.product.name}</span>
                            <span className="text-muted-foreground">× {selectedOrder.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Farmer: {selectedOrder.farmer.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ShoppingBag className="h-4 w-4" />
                            <span>Total: {formatPrice(selectedOrder.totalPrice)}</span>
                          </div>
                        </div>

                        {/* Rating Stars */}
                        <div className="space-y-2">
                          <Label>Your Rating *</Label>
                          <div className="flex gap-1">
                            {renderStars(rating, true)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rating === 0 && 'Click a star to rate'}
                            {rating === 1 && 'Poor - Needs improvement'}
                            {rating === 2 && 'Fair - Below average'}
                            {rating === 3 && 'Good - Satisfactory'}
                            {rating === 4 && 'Great - Very good'}
                            {rating === 5 && 'Excellent - Outstanding!'}
                          </p>
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                          <Label htmlFor="comment">Your Review (Optional)</Label>
                          <Textarea
                            id="comment"
                            placeholder="Share your experience with the farmer..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground">
                            {comment.length}/500 characters
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary/90"
                            disabled={submitting || rating === 0}
                          >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(null);
                              setRating(0);
                              setComment('');
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-sm h-[300px] flex items-center justify-center">
                    <CardContent className="text-center">
                      <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">Select an Order</h3>
                      <p className="text-muted-foreground">
                        Choose a completed order from the list to write a review
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}