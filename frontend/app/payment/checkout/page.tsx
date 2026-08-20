'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, CreditCard, ArrowLeft, Truck, Package } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      toast.error('No order selected');
      router.push('/orders');
      return;
    }
    fetchPaymentStatus();
    fetchOrderDetails();
  }, [orderId]);

  const fetchPaymentStatus = async () => {
    try {
      const response = await api.get(`/payments/status/${orderId}`);
      setPaymentIntent(response.data);
      setCheckoutUrl(response.data.checkoutUrl || response.data.paymentIntent?.checkoutUrl);
    } catch (error: any) {
      // If 404, no payment intent exists yet
      if (error.response?.status === 404) {
        console.log('No payment intent found, user needs to create one');
        setError('No payment found. Please create a payment intent.');
      } else {
        console.error('Failed to fetch payment status:', error);
        toast.error('Failed to load payment details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrderDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
  };

  const createPaymentIntent = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/payments/intent', {
        orderId: orderId,
        returnUrl: `${window.location.origin}/payment/success`,
      });
      
      const data = response.data;
      setPaymentIntent(data.paymentIntent);
      
      if (data.checkoutUrl) {
        // Redirect to Chapa checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Failed to create payment intent:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (checkoutUrl) {
      setProcessing(true);
      window.location.href = checkoutUrl;
    } else {
      // Create new payment intent
      await createPaymentIntent();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      default:
        return <CreditCard className="h-12 w-12 text-blue-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'Payment Successful!';
      case 'FAILED':
        return 'Payment Failed';
      case 'PENDING':
        return 'Payment Pending';
      default:
        return 'Ready to Pay';
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  const paymentStatus = paymentIntent?.paymentIntent?.status || paymentIntent?.status || 'CREATED';
  const amount = paymentIntent?.paymentIntent?.amount || paymentIntent?.amount || orderDetails?.totalPrice || 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Link href="/orders" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>

          <Card className="border-0 shadow-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {getStatusIcon(paymentStatus)}
              </div>
              <CardTitle className="text-2xl">{getStatusText(paymentStatus)}</CardTitle>
              <CardDescription>
                Order #{orderId?.slice(0, 8)} • {formatPrice(amount)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Details */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="font-semibold">{formatPrice(amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={paymentStatus === 'SUCCEEDED' ? 'bg-green-100 text-green-700 border-green-200' : paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}>
                    {paymentStatus}
                  </Badge>
                </div>
                {paymentIntent?.paymentIntent?.expiresAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expires</span>
                    <span>{new Date(paymentIntent.paymentIntent.expiresAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Order Items */}
              {orderDetails && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Order Items</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{orderDetails.product?.name}</span>
                      <span>{orderDetails.quantity} × {formatPrice(orderDetails.product?.price)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total</span>
                      <span>{formatPrice(orderDetails.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Commission Info */}
              {paymentIntent?.commission && (
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <p className="text-sm text-muted-foreground">Commission (3%)</p>
                  <p className="text-lg font-semibold text-primary">{formatPrice(paymentIntent.commission.amount)}</p>
                  <p className="text-xs text-muted-foreground">Status: {paymentIntent.commission.status}</p>
                </div>
              )}

              {/* Action Buttons */}
              {paymentStatus === 'CREATED' && (
                <Button
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay with Chapa
                    </>
                  )}
                </Button>
              )}

              {paymentStatus === 'PENDING' && (
                <div className="text-center text-muted-foreground">
                  <p>Waiting for payment confirmation...</p>
                  <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                    Check Status
                  </Button>
                </div>
              )}

              {paymentStatus === 'SUCCEEDED' && (
                <div className="space-y-2">
                  <div className="text-center text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
                    ✅ Payment completed successfully!
                  </div>
                  <Link href={`/orders/${orderId}`}>
                    <Button variant="outline" className="w-full">
                      View Order
                    </Button>
                  </Link>
                </div>
              )}

              {paymentStatus === 'FAILED' && (
                <div className="space-y-2">
                  <div className="text-center text-red-600 bg-red-50 p-3 rounded-lg">
                    ❌ Payment failed. Please try again.
                  </div>
                  <Button onClick={handlePay} className="w-full bg-primary hover:bg-primary/90">
                    Retry Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}