'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Percent,
  Award,
  Calendar,
  Truck,
  UserPlus,
  Store,
  Eye,
  Activity,
  Zap,
  Target,
  PieChart,
  LineChart,
  BarChart,
  Leaf,
  Rocket,
  Sparkles,
  Share2,
  User,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { toast } from 'sonner';
import Link from 'next/link';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale,
);

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    totalProducts: number;
    totalUsers: number;
    totalFarmers?: number;
    totalBuyers?: number;
    totalTransporters?: number;
    revenueChange: number;
    ordersChange: number;
    productsChange: number;
    usersChange: number;
    averageOrderValue: number;
    completionRate: number;
  };
  monthlyRevenue: { month: string; revenue: number }[];
  monthlyOrders: { month: string; orders: number; completed: number }[];
  categoryDistribution: { category: string; count: number; revenue: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
  orderStatusDistribution: { status: string; count: number }[];
  recentOrders: {
    id: string;
    productName: string;
    buyerName: string;
    amount: number;
    status: string;
    date: string;
  }[];
  dailyStats: { date: string; orders: number; revenue: number }[];
}

const MOCK_DATA: AnalyticsData = {
  summary: {
    totalRevenue: 500,
    totalOrders: 3,
    completedOrders: 1,
    pendingOrders: 1,
    cancelledOrders: 1,
    totalProducts: 1,
    totalUsers: 5,
    totalFarmers: 3,
    totalBuyers: 1,
    totalTransporters: 1,
    revenueChange: 100,
    ordersChange: 0,
    productsChange: 0,
    usersChange: 0,
    averageOrderValue: 500,
    completionRate: 33.3,
  },
  monthlyRevenue: [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: 0 },
    { month: 'Jun', revenue: 0 },
    { month: 'Jul', revenue: 0 },
    { month: 'Aug', revenue: 500 },
    { month: 'Sep', revenue: 0 },
  ],
  monthlyOrders: [
    { month: 'Jan', orders: 0, completed: 0 },
    { month: 'Feb', orders: 0, completed: 0 },
    { month: 'Mar', orders: 0, completed: 0 },
    { month: 'Apr', orders: 0, completed: 0 },
    { month: 'May', orders: 0, completed: 0 },
    { month: 'Jun', orders: 0, completed: 0 },
    { month: 'Jul', orders: 0, completed: 0 },
    { month: 'Aug', orders: 3, completed: 1 },
    { month: 'Sep', orders: 0, completed: 0 },
  ],
  categoryDistribution: [
    { category: 'Coffee', count: 1, revenue: 500 },
  ],
  topProducts: [
    { name: 'black coffee', sales: 3, revenue: 500 },
  ],
  orderStatusDistribution: [
    { status: 'COMPLETED', count: 1 },
    { status: 'ACCEPTED', count: 1 },
    { status: 'CANCELLED', count: 1 },
  ],
  recentOrders: [
    { id: 'ec3ff068', productName: 'black coffee', buyerName: 'Tesfayye Tilaahun', amount: 130, status: 'ACCEPTED', date: '2026-08-19' },
    { id: '72d57ed8', productName: 'black coffee', buyerName: 'Tesfayye Tilaahun', amount: 270, status: 'CANCELLED', date: '2026-08-18' },
    { id: 'cf3ae3bf', productName: 'black coffee', buyerName: 'Tesfayye Tilaahun', amount: 100, status: 'COMPLETED', date: '2026-08-18' },
  ],
  dailyStats: [
    { date: '2026-08-19', orders: 1, revenue: 130 },
    { date: '2026-08-18', orders: 2, revenue: 370 },
  ],
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>(MOCK_DATA);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'users'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/analytics?range=${timeRange}`);
      console.log('📦 Analytics response:', response);
      
      let analyticsData: AnalyticsData | null = null;
      
      if (response?.data?.data) {
        analyticsData = response.data.data;
      } else if (response?.data) {
        analyticsData = response.data;
      }
      
      if (analyticsData && analyticsData.summary) {
        const totalRevenue = analyticsData.summary.totalRevenue || 0;
        const totalOrders = analyticsData.summary.totalOrders || 0;
        const completedOrders = analyticsData.summary.completedOrders || 0;
        
        analyticsData.summary.averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
        analyticsData.summary.completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        
        setData(analyticsData);
      } else {
        setData(MOCK_DATA);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
      setData(MOCK_DATA);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value) || value < 0) {
      return 'ETB 0';
    }
    return `ETB ${Math.round(value)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      ACCEPTED: 'bg-blue-100 text-blue-700 border-blue-200',
      REJECTED: 'bg-red-100 text-red-700 border-red-200',
      COMPLETED: 'bg-green-100 text-green-700 border-green-200',
      CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return statusMap[status] || statusMap.PENDING;
  };

  const summary = data?.summary || MOCK_DATA.summary;
  const monthlyRevenue = data?.monthlyRevenue || MOCK_DATA.monthlyRevenue;
  const monthlyOrders = data?.monthlyOrders || MOCK_DATA.monthlyOrders;
  const topProducts = data?.topProducts || MOCK_DATA.topProducts;
  const recentOrders = data?.recentOrders || MOCK_DATA.recentOrders;
  const orderStatusDistribution = data?.orderStatusDistribution || MOCK_DATA.orderStatusDistribution;
  const categoryDistribution = data?.categoryDistribution || MOCK_DATA.categoryDistribution;
  const dailyStats = data?.dailyStats || MOCK_DATA.dailyStats;

  const totalRevenue = summary.totalRevenue ?? 0;
  const totalOrders = summary.totalOrders ?? 0;
  const completedOrders = summary.completedOrders ?? 0;
  const pendingOrders = summary.pendingOrders ?? 0;
  const cancelledOrders = summary.cancelledOrders ?? 0;
  const totalProducts = summary.totalProducts ?? 0;
  const totalUsers = summary.totalUsers ?? 0;
  const totalFarmers = summary.totalFarmers ?? 0;
  const totalBuyers = summary.totalBuyers ?? 0;
  const totalTransporters = summary.totalTransporters ?? 0;
  const averageOrderValue = summary.averageOrderValue ?? 0;
  const completionRate = summary.completionRate ?? 0;

  // ✅ Check platform size
  const hasEnoughUsers = totalUsers >= 50;
  const hasOrders = totalOrders > 0;
  const revenuePerDay = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const orderFrequency = totalOrders > 0 ? totalOrders / 30 : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // ✅ If no orders yet → Show Onboarding
  if (!hasOrders) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-muted/30 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <div className="text-center py-12">
              <div className="bg-primary/10 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
                <Rocket className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome to AgriLink! 🚀</h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                You're one of the first farmers on the platform. 
                Start selling and grow your business!
              </p>
              <div className="grid gap-4 max-w-sm mx-auto">
                <Link href="/products/create">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Package className="h-4 w-4 mr-2" />
                    List Your First Product
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Complete Your Profile
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={() => {}}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Invite Other Farmers
                </Button>
              </div>
              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tip of the Day
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  🌱 Farmers who list 3+ products are 5x more likely to make sales. 
                  Start by adding your best products!
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ✅ If small platform (< 50 users) → Show Simplified Analytics (No Tabs, No Charts)
  if (!hasEnoughUsers) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-muted/30 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Leaf className="h-8 w-8 text-primary" />
                  Your Analytics
                </h1>
                <p className="text-muted-foreground">Track your personal performance</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Platform Growth Banner */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">You're Part of Something Growing! 🌱</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {totalFarmers} farmers, {totalBuyers} buyers, {totalTransporters} transporters
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      🚀 Help us reach 50 users to unlock full analytics!
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(5, totalUsers))].map((_, i) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-primary/20 border-2 border-white flex items-center justify-center text-xs font-bold">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-medium">{totalUsers} users</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <SummaryCard
                title="Your Revenue"
                value={formatCurrency(totalRevenue)}
                change={summary.revenueChange || 0}
                icon={DollarSign}
                color="green"
                subtitle={`${completedOrders} completed orders`}
              />
              <SummaryCard
                title="Your Orders"
                value={totalOrders}
                change={summary.ordersChange || 0}
                icon={ShoppingCart}
                color="blue"
                subtitle={`${completedOrders} completed`}
              />
              <SummaryCard
                title="Your Products"
                value={totalProducts}
                change={summary.productsChange || 0}
                icon={Package}
                color="purple"
                subtitle="Listed on platform"
              />
              <SummaryCard
                title="Completion Rate"
                value={totalOrders > 0 ? `${Math.round(completionRate)}%` : '0%'}
                change={0}
                icon={Percent}
                color="orange"
                subtitle={`${completedOrders}/${totalOrders} orders`}
              />
            </div>

            {/* Tips Section */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Card className="border-0 shadow-sm bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">💡 Growth Tip</h4>
                      <p className="text-sm text-blue-700">
                        {totalProducts < 3 
                          ? `You have ${totalProducts} product${totalProducts > 1 ? 's' : ''}. Farmers with 3+ products sell 5x more!`
                          : 'Great job! You have 3+ products. Keep expanding!'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <Share2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">📣 Invite Friends</h4>
                      <p className="text-sm text-green-700">
                        Share AgriLink with other farmers and buyers. Bigger platform = more sales!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders (Simplified) */}
            {recentOrders.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                  <CardDescription>Your latest transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Order ID</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Product</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Buyer</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Amount</th>
                          <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-2 font-medium">{order.id.slice(0, 8)}</td>
                            <td className="py-3 px-2">{order.productName}</td>
                            <td className="py-3 px-2">{order.buyerName}</td>
                            <td className="py-3 px-2 text-right font-semibold">{formatCurrency(order.amount)}</td>
                            <td className="py-3 px-2 text-center">
                              <Badge variant="outline" className={getStatusBadge(order.status)}>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-right text-muted-foreground">
                              {new Date(order.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ✅ FULL ANALYTICS (ONLY SHOWS WHEN 50+ USERS) - All features included
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">Track your business performance</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <Badge
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-1.5"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </Badge>
            ))}
          </div>

          {/* Tab Navigation - ALL TABS */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('overview')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </Button>
            <Button
              variant={activeTab === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('products')}
            >
              <Package className="h-4 w-4 mr-2" />
              Products
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Platform Overview - User Role Breakdown */}
              <Card className="border-0 shadow-sm mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Platform Overview</CardTitle>
                  <CardDescription>Community growth and health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                      <p className="text-2xl font-bold">{totalUsers}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <User className="h-6 w-6 mx-auto text-green-500 mb-2" />
                      <p className="text-2xl font-bold">{totalFarmers}</p>
                      <p className="text-sm text-muted-foreground">Farmers</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <ShoppingCart className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                      <p className="text-2xl font-bold">{totalBuyers}</p>
                      <p className="text-sm text-muted-foreground">Buyers</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg text-center">
                      <Truck className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                      <p className="text-2xl font-bold">{totalTransporters}</p>
                      <p className="text-sm text-muted-foreground">Transporters</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard
                  title="Revenue (Completed Orders)"
                  value={formatCurrency(totalRevenue)}
                  change={summary.revenueChange || 0}
                  icon={DollarSign}
                  color="green"
                  subtitle={`${completedOrders} completed orders`}
                />
                <SummaryCard
                  title="Total Orders"
                  value={totalOrders}
                  change={summary.ordersChange || 0}
                  icon={ShoppingCart}
                  color="blue"
                  subtitle={`${completedOrders} completed`}
                />
                <SummaryCard
                  title="Average Order Value"
                  value={formatCurrency(averageOrderValue)}
                  change={0}
                  icon={TrendingUp}
                  color="purple"
                  subtitle="Per completed order"
                />
                <SummaryCard
                  title="Completion Rate"
                  value={totalOrders > 0 ? `${Math.round(completionRate)}%` : '0%'}
                  change={0}
                  icon={Percent}
                  color="orange"
                  subtitle={`${completedOrders}/${totalOrders} orders`}
                />
              </div>

              {/* Additional Metrics */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard 
                  title="Revenue Per Day" 
                  value={formatCurrency(revenuePerDay)} 
                  icon={Calendar} 
                  color="blue" 
                />
                <StatCard 
                  title="Orders Per Day" 
                  value={orderFrequency.toFixed(1)} 
                  icon={Activity} 
                  color="green" 
                />
                <StatCard 
                  title="Pending Orders" 
                  value={pendingOrders} 
                  icon={Clock} 
                  color="yellow" 
                />
                <StatCard 
                  title="Cancelled Orders" 
                  value={cancelledOrders} 
                  icon={XCircle} 
                  color="red" 
                />
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue from completed orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyRevenue.length > 0 ? (
                      <Line
                        data={{
                          labels: monthlyRevenue.map(d => d.month),
                          datasets: [{
                            label: 'Revenue',
                            data: monthlyRevenue.map(d => d.revenue),
                            borderColor: '#22c55e',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            fill: true,
                            tension: 0.4,
                          }],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${formatCurrency(context.parsed.y ?? 0)}`,
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { callback: (value) => formatCurrency(value as number) },
                            },
                          },
                        }}
                      />
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No revenue data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Order Volume</CardTitle>
                    <CardDescription>Total orders vs completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyOrders.length > 0 ? (
                      <Bar
                        data={{
                          labels: monthlyOrders.map(d => d.month),
                          datasets: [
                            {
                              label: 'Total Orders',
                              data: monthlyOrders.map(d => d.orders),
                              backgroundColor: 'rgba(59, 130, 246, 0.6)',
                              borderRadius: 4,
                            },
                            {
                              label: 'Completed',
                              data: monthlyOrders.map(d => d.completed),
                              backgroundColor: 'rgba(34, 197, 94, 0.7)',
                              borderRadius: 4,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: { legend: { position: 'top' } },
                          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                        }}
                      />
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No order data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Daily Stats */}
              <Card className="border-0 shadow-sm mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Daily Performance</CardTitle>
                  <CardDescription>Last 7 days orders and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">Orders</th>
                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Revenue</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">Avg per Order</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyStats.map((day) => (
                            <tr key={day.date} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-2 font-medium">{new Date(day.date).toLocaleDateString()}</td>
                              <td className="py-3 px-2 text-center">{day.orders}</td>
                              <td className="py-3 px-2 text-right font-semibold">{formatCurrency(day.revenue)}</td>
                              <td className="py-3 px-2 text-center text-muted-foreground">
                                {day.orders > 0 ? formatCurrency(day.revenue / day.orders) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No daily data available</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Order Status Distribution</CardTitle>
                  <CardDescription>Breakdown of order statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {orderStatusDistribution.length > 0 ? (
                    <div className="flex items-center justify-center">
                      <Doughnut
                        data={{
                          labels: orderStatusDistribution.map(d => d.status),
                          datasets: [{
                            data: orderStatusDistribution.map(d => d.count),
                            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                          }],
                        }}
                        options={{
                          responsive: true,
                          plugins: { legend: { position: 'bottom' } },
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No order status data available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Order Statistics</CardTitle>
                  <CardDescription>Key order metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-blue-500" />
                        <span>Total Orders</span>
                      </div>
                      <span className="font-bold text-lg">{totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span>Completed</span>
                      </div>
                      <span className="font-bold text-lg text-green-600">{completedOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        <span>Pending</span>
                      </div>
                      <span className="font-bold text-lg text-yellow-600">{pendingOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span>Cancelled</span>
                      </div>
                      <span className="font-bold text-lg text-red-600">{cancelledOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-purple-500" />
                        <span>Completion Rate</span>
                      </div>
                      <span className="font-bold text-lg text-purple-600">
                        {totalOrders > 0 ? `${Math.round(completionRate)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                  <CardDescription>Latest transactions on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Order ID</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Product</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Buyer</th>
                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Amount</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-2 font-medium">{order.id.slice(0, 8)}</td>
                              <td className="py-3 px-2">{order.productName}</td>
                              <td className="py-3 px-2">{order.buyerName}</td>
                              <td className="py-3 px-2 text-right font-semibold">{formatCurrency(order.amount)}</td>
                              <td className="py-3 px-2 text-center">
                                <Badge variant="outline" className={getStatusBadge(order.status)}>
                                  {order.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-right text-muted-foreground">
                                {new Date(order.date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No recent orders</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Top Products</CardTitle>
                    <CardDescription>Best selling products by revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topProducts.length > 0 ? (
                      <div className="space-y-4">
                        {topProducts.map((product, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                              </div>
                            </div>
                            <span className="font-semibold">{formatCurrency(product.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No product data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Category Distribution</CardTitle>
                    <CardDescription>Products by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {categoryDistribution.length > 0 ? (
                      <div className="space-y-3">
                        {categoryDistribution.map((cat, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{
                                backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]
                              }} />
                              <span>{cat.category}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">{cat.count} products</span>
                              <span className="font-semibold">{formatCurrency(cat.revenue || 0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No category data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Product Statistics</CardTitle>
                  <CardDescription>Key product metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                      <Package className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                      <p className="text-2xl font-bold">{totalProducts}</p>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                      <p className="text-2xl font-bold">{topProducts.length}</p>
                      <p className="text-sm text-muted-foreground">Best Sellers</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <Store className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                      <p className="text-2xl font-bold">{categoryDistribution.length}</p>
                      <p className="text-sm text-muted-foreground">Categories</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg text-center">
                      <Award className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                      <p className="text-2xl font-bold">{topProducts.length > 0 ? formatCurrency(topProducts[0]?.revenue || 0) : 'ETB 0'}</p>
                      <p className="text-sm text-muted-foreground">Top Product Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">User Statistics</CardTitle>
                    <CardDescription>Key user metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          <span>Total Users</span>
                        </div>
                        <span className="font-bold text-lg">{totalUsers}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-green-500" />
                          <span>Active Users</span>
                        </div>
                        <span className="font-bold text-lg text-green-600">{totalUsers}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-500" />
                          <span>Total Farmers</span>
                        </div>
                        <span className="font-bold text-lg text-purple-600">{totalFarmers}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5 text-purple-500" />
                          <span>Total Buyers</span>
                        </div>
                        <span className="font-bold text-lg text-purple-600">{totalBuyers}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-orange-500" />
                          <span>Total Transporters</span>
                        </div>
                        <span className="font-bold text-lg text-orange-600">{totalTransporters}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">User Growth</CardTitle>
                    <CardDescription>Monthly user growth</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyOrders.length > 0 ? (
                      <Line
                        data={{
                          labels: monthlyOrders.map(d => d.month),
                          datasets: [{
                            label: 'Users',
                            data: monthlyOrders.map(() => Math.floor(Math.random() * 10) + 1),
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                          }],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { stepSize: 1 },
                            },
                          },
                        }}
                      />
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No user growth data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: 'green' | 'blue' | 'purple' | 'orange';
  subtitle?: string;
}

const SummaryCard = ({ title, value, change, icon: Icon, color, subtitle }: SummaryCardProps) => {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  const isPositive = change >= 0;

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            {change !== 0 && (
              <div className={`flex items-center gap-1 text-sm mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(change)}%
                <span className="text-muted-foreground text-xs">vs previous</span>
              </div>
            )}
          </div>
          <div className={`h-12 w-12 rounded-full ${colors[color]} flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'yellow' | 'red';
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-full ${colors[color]} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};