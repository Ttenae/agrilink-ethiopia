'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  Star,
  StarHalf,
  MessageCircle,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Leaf,
  ShoppingBag,
  Store,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
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
  order: {
    id: string;
    product: {
      name: string;
      category: string;
    };
  };
}

interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratings: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'farmer' | 'buyer'>('all');
  const [farmerId, setFarmerId] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'FARMER') {
        setFarmerId(user.id);
        setView('farmer');
      }
      fetchReviews();
      fetchStats();
    }
  }, [user, view, farmerId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let response;
      if (view === 'farmer' && farmerId) {
        response = await api.get(`/reviews/farmer/${farmerId}`);
      } else if (view === 'buyer' && user) {
        response = await api.get('/reviews/buyer/me');
      } else {
        response = await api.get('/reviews');
      }
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (user?.role === 'FARMER') {
        const response = await api.get(`/reviews/farmer/${user.id}/rating`);
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<StarHalf key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return stars;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
              <p className="text-muted-foreground">
                {view === 'farmer' 
                  ? 'Ratings and feedback from your customers' 
                  : view === 'buyer' 
                  ? 'Reviews you\'ve written' 
                  : 'All reviews'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user && user.role === 'BUYER' && (
                <Link href="/reviews/create">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Write Review
                  </Button>
                </Link>
              )}
              {user && user.role !== 'FARMER' && (
                <>
                  <Button
                    variant={view === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('all')}
                  >
                    All Reviews
                  </Button>
                  <Button
                    variant={view === 'buyer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('buyer')}
                  >
                    My Reviews
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats Card (Farmer Only) */}
          {user?.role === 'FARMER' && stats && stats.totalReviews > 0 && (
            <Card className="mb-6 border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {stats.averageRating.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {renderStars(Math.round(stats.averageRating))}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = stats.ratings[star as keyof typeof stats.ratings] || 0;
                      const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-sm w-8">{star} ★</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No reviews yet</h3>
              <p className="text-muted-foreground">
                {view === 'farmer' 
                  ? 'You haven\'t received any reviews yet. Complete more orders to get feedback.' 
                  : view === 'buyer' 
                  ? 'You haven\'t written any reviews yet. Rate farmers after completing orders.' 
                  : 'No reviews in the system.'}
              </p>
              {view === 'buyer' && (
                <Link href="/orders">
                  <Button className="mt-4">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    View Your Orders
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} userRole={user?.role || ''} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface ReviewCardProps {
  review: Review;
  userRole: string;
}

const ReviewCard = ({ review, userRole }: ReviewCardProps) => {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
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

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 bg-primary/10">
            <AvatarFallback className="text-primary">
              {userRole === 'FARMER' ? getInitials(review.buyer.name) : getInitials(review.farmer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {userRole === 'FARMER' ? review.buyer.name : review.farmer.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {review.order.product.category}
              </Badge>
            </div>
            {review.comment && (
              <p className="mt-2 text-muted-foreground">{review.comment}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Ordered:</span>
              <Link href={`/orders/${review.order.id}`} className="text-primary hover:underline">
                {review.order.product.name}
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};