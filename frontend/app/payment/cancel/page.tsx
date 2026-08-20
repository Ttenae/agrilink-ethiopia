'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            You cancelled the payment process.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            No charges were made to your account. You can try again whenever you're ready.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/orders" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <Link href="/products" className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}