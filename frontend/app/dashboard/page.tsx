'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  ShoppingBag,
  Package,
  TrendingUp,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Route
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data.stats);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'ADMIN') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const statColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  const StatCard = ({ icon: Icon, title, value, color }: any) => {
    const colorClass = statColors[color] || statColors.blue;
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
            <div className={`h-12 w-12 rounded-full ${colorClass} flex items-center justify-center`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const QuickAction = ({ icon: Icon, title, description, href }: any) => (
    <Link href={href}>
      <Card className="border-2 border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const isTransporter = user?.role === 'TRANSPORTER';
  const isFarmer = user?.role === 'FARMER';
  const isBuyer = user?.role === 'BUYER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name} 👋</h1>
            <p className="text-muted-foreground mt-1">
              {isFarmer
                ? 'Manage your products and orders'
                : isBuyer
                ? 'Browse products and track your orders'
                : isTransporter
                ? 'Manage your deliveries and track orders'
                : isAdmin
                ? 'Oversee the entire platform'
                : 'Welcome to AgriLink'}
            </p>
          </div>

          {isAdmin && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} title="Total Users" value={stats?.totalUsers || 0} color="blue" />
              <StatCard icon={ShoppingBag} title="Total Products" value={stats?.totalProducts || 0} color="green" />
              <StatCard icon={ClipboardList} title="Total Orders" value={stats?.totalOrders || 0} color="purple" />
              <StatCard icon={TrendingUp} title="Revenue" value={`${stats?.totalRevenue || 0} ETB`} color="orange" />
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isFarmer && (
              <>
                <QuickAction icon={Plus} title="Add Product" description="List a new product" href="/products/create" />
                <QuickAction icon={Package} title="My Products" description="Manage listings" href="/products/my" />
                <QuickAction icon={ShoppingCart} title="Orders" description="View incoming orders" href="/orders" />
                <QuickAction icon={Star} title="Reviews" description="See your ratings" href="/reviews" />
              </>
            )}
            {isBuyer && (
              <>
                <QuickAction icon={ShoppingBag} title="Browse Products" description="Find what you need" href="/products" />
                <QuickAction icon={ShoppingCart} title="My Orders" description="Track your orders" href="/orders" />
                <QuickAction icon={Truck} title="Order History" description="View past purchases" href="/orders" />
                <QuickAction icon={Star} title="Write Review" description="Rate farmers" href="/reviews/create" />
              </>
            )}
            {isTransporter && (
              <>
                <QuickAction icon={Truck} title="Available Orders" description="Find deliveries to pick up" href="/transport/available" />
                <QuickAction icon={Route} title="My Deliveries" description="Track your assigned deliveries" href="/transport/my-deliveries" />
                <QuickAction icon={MapPin} title="Update Status" description="Update delivery status" href="/transport/update-status" />
                <QuickAction icon={Star} title="My Reviews" description="See your ratings" href="/reviews" />
              </>
            )}
            {isAdmin && (
              <>
                <QuickAction icon={Users} title="Manage Users" description="View all users" href="/admin/users" />
                <QuickAction icon={ShoppingBag} title="Manage Products" description="Oversee listings" href="/admin/products" />
                <QuickAction icon={ClipboardList} title="Manage Orders" description="View all orders" href="/admin/orders" />
                <QuickAction icon={LayoutDashboard} title="Full Dashboard" description="Complete admin view" href="/admin/dashboard" />
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}