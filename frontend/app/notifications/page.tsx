'use client';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle2, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  // In a real app, you would fetch these from the database
  const mockNotifications = [
    { id: 1, title: 'Order Accepted', message: 'Your order #1234 has been accepted by the farmer.', time: '2 hours ago', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 2, title: 'Delivery Arriving', message: 'Your transporter is nearby.', time: '5 hours ago', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 3, title: 'Payment Confirmed', message: 'We received your payment of 8,500 ETB.', time: '1 day ago', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-8 w-8 text-green-600" /> Notifications
              </h1>
              <p className="text-gray-500 mt-1">Stay updated with your account activity</p>
            </div>
            <Button variant="outline" className="bg-white">Mark all as read</Button>
          </div>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-0">
              {mockNotifications.map((notif, index) => (
                <div key={notif.id} className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors ${index !== mockNotifications.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.bg} ${notif.color}`}>
                    <notif.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{notif.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}