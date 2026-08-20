'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, ShoppingBag, Receipt } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);

  useEffect(() => {
    const txRefParam = searchParams.get('tx_ref');
    const orderIdParam = searchParams.get('order_id');
    const status = searchParams.get('status');

    if (status === 'success') {
      if (orderIdParam) {
        setOrderId(orderIdParam);
        setLoading(false);
      } else if (txRefParam) {
        setTxRef(txRefParam);
        // Try to find order by transaction reference
        verifyPayment(txRefParam);
      } else {
        setLoading(false);
        toast.error('Payment verification failed');
      }
    } else {
      setLoading(false);
      toast.error('Payment was not successful');
      router.push('/orders');
    }
  }, []);

  const verifyPayment = async (ref: string) => {
    try {
      const response = await api.get(`/payments/verify/${ref}`);
      if (response.data.orderId) {
        setOrderId(response.data.orderId);
      }
    } catch (error) {
      console.error('Failed to verify payment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Successful! 🎉</CardTitle>
          <CardDescription>
            Your payment has been processed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-green-700 font-medium">Thank you for your payment!</p>
            {orderId && (
              <p className="text-sm text-green-600 mt-1">
                Order #{orderId.slice(0, 8)} is now being processed.
              </p>
            )}
            {txRef && (
              <p className="text-xs text-muted-foreground mt-1">
                Transaction: {txRef}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href={orderId ? `/orders/${orderId}` : '/orders'} className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90">
              <Receipt className="h-4 w-4 mr-2" />
              View Order
            </Button>
          </Link>
          <Link href="/products" className="w-full">
            <Button variant="outline" className="w-full">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}