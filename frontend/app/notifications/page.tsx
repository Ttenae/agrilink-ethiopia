'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { useAuth } from '../../context/AuthContext'; // ✅ Import AuthContext
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle2, ShoppingBag, Truck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { socket } = useAuth(); // ✅ Get global socket
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      // ✅ Add cache-buster to prevent Next.js caching
      const res = await api.get(`/notifications?t=${Date.now()}`);
      console.log("🔍 Fetched Notifications:", res.data);
      setNotifications(res.data);
      
      // Mark as read after 3 seconds
      setTimeout(async () => {
        try {
          await api.patch('/notifications/read-all');
        } catch (e) {
          console.error('Failed to mark as read', e);
        }
      }, 3000);
      
    } catch (err: any) {
      console.error("❌ Fetch error:", err.response?.data || err.message);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ✅ Listen to global socket for new notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      console.log("🔔 New notification signal received, refreshing...");
      fetchNotifications();
    };

    // Listen to both events (new message might trigger a notification)
    socket.on('new-message', handleNewNotification);
    socket.on('unread-count', handleNewNotification);

    return () => {
      socket.off('new-message', handleNewNotification);
      socket.off('unread-count', handleNewNotification);
    };
  }, [socket]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <ShoppingBag className="h-5 w-5 text-blue-600" />;
      case 'DELIVERY': return <Truck className="h-5 w-5 text-orange-600" />;
      default: return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-green-600" /></div>;

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
          </div>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>You have no notifications yet.</p>
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <div key={notif.id} className={`p-4 flex gap-4 transition-colors ${!notif.isRead ? 'bg-green-50/30' : 'hover:bg-gray-50'} ${index !== notifications.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-gray-900 ${!notif.isRead ? 'font-bold' : 'font-semibold'}`}>{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                    {!notif.isRead && <div className="h-2 w-2 rounded-full bg-green-500 mt-2"></div>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}