import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics(range: string = '30d') {
    // Get date range
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // ✅ Get user counts by role
    const [totalUsers, totalFarmers, totalBuyers, totalTransporters] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'FARMER' } }),
      this.prisma.user.count({ where: { role: 'BUYER' } }),
      this.prisma.user.count({ where: { role: 'TRANSPORTER' } }),
    ]);

    // ✅ Get order status counts
    const [totalOrders, completedOrders, pendingOrders, cancelledOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
    ]);

    // ✅ Get total revenue from COMPLETED orders only
    const totalRevenue = await this.prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalPrice: true },
    });

    const totalRevenueValue = totalRevenue._sum.totalPrice || 0;

    // ✅ Calculate derived values
    const averageOrderValue = completedOrders > 0 ? totalRevenueValue / completedOrders : 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Summary stats
    const [totalProducts, totalCommission] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.payment.aggregate({ _sum: { commissionAmount: true } }),
    ]);

    // Monthly revenue (last 12 months)
    const monthlyRevenue = await this.getMonthlyRevenue();
    
    // Monthly orders (last 12 months)
    const monthlyOrders = await this.getMonthlyOrders();
    
    // Category distribution
    const categoryDistribution = await this.getCategoryDistribution();
    
    // Top products
    const topProducts = await this.getTopProducts();
    
    // Recent orders
    const recentOrders = await this.getRecentOrders();

    // Calculate changes
    const previousRevenue = await this.getPreviousRevenue();
    const previousOrders = await this.getPreviousOrders();
    const previousProducts = await this.getPreviousProducts();
    const previousUsers = await this.getPreviousUsers();

    return {
      summary: {
        totalRevenue: totalRevenueValue,
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalProducts,
        totalUsers,
        totalFarmers,        // ✅ ADDED
        totalBuyers,         // ✅ ADDED
        totalTransporters,   // ✅ ADDED
        averageOrderValue,
        completionRate,
        revenueChange: this.calculateChange(previousRevenue, totalRevenueValue),
        ordersChange: this.calculateChange(previousOrders, totalOrders),
        productsChange: this.calculateChange(previousProducts, totalProducts),
        usersChange: this.calculateChange(previousUsers, totalUsers),
      },
      monthlyRevenue,
      monthlyOrders,
      categoryDistribution: categoryDistribution.map(c => ({
        ...c,
        revenue: 0,
      })),
      topProducts,
      recentOrders,
      orderStatusDistribution: [
        { status: 'COMPLETED', count: completedOrders },
        { status: 'PENDING', count: pendingOrders },
        { status: 'CANCELLED', count: cancelledOrders },
      ],
      dailyStats: await this.getDailyStats(),
    };
  }

  private async getMonthlyRevenue() {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      
      const revenue = await this.prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: { totalPrice: true },
      });
      
      months.push({
        month: date.toLocaleString('en-US', { month: 'short' }),
        revenue: revenue._sum.totalPrice || 0,
      });
    }
    
    return months;
  }

  private async getMonthlyOrders() {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      
      const [total, completed] = await Promise.all([
        this.prisma.order.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        this.prisma.order.count({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);
      
      months.push({
        month: date.toLocaleString('en-US', { month: 'short' }),
        orders: total,
        completed: completed,
      });
    }
    
    return months;
  }

  private async getCategoryDistribution() {
    const products = await this.prisma.product.groupBy({
      by: ['category'],
      _count: true,
    });
    
    return products.map(p => ({
      category: p.category,
      count: p._count,
      revenue: 0,
    }));
  }

  private async getTopProducts() {
    const products = await this.prisma.order.groupBy({
      by: ['productId'],
      where: { status: 'COMPLETED' },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc',
        },
      },
      take: 5,
    });

    if (products.length === 0) {
      return [];
    }

    const productIds = products.map(p => p.productId);
    const productNames = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = productNames.reduce((acc, p) => {
      acc[p.id] = p.name;
      return acc;
    }, {} as Record<string, string>);

    return products.map(p => ({
      name: productMap[p.productId] || 'Unknown',
      sales: p._sum.quantity || 0,
      revenue: p._sum.totalPrice || 0,
    }));
  }

  private async getRecentOrders() {
    const orders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true } },
        product: { select: { name: true } },
      },
    });

    return orders.map(o => ({
      id: o.id,
      productName: o.product.name,
      buyerName: o.buyer.name,
      amount: o.totalPrice,
      status: o.status,
      date: o.createdAt.toISOString().split('T')[0],
    }));
  }

  private async getDailyStats() {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        totalPrice: true,
        status: true,
      },
    });

    const dailyMap = new Map<string, { orders: number; revenue: number }>();
    
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { orders: 0, revenue: 0 });
      }
      const entry = dailyMap.get(date)!;
      entry.orders += 1;
      if (order.status === 'COMPLETED') {
        entry.revenue += order.totalPrice;
      }
    });

    return Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      orders: stats.orders,
      revenue: stats.revenue,
    }));
  }

  private async getPreviousRevenue() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const result = await this.prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: { totalPrice: true },
    });
    
    return result._sum.totalPrice || 0;
  }

  private async getPreviousOrders() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this.prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    });
  }

  private async getPreviousProducts() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this.prisma.product.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    });
  }

  private async getPreviousUsers() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    });
  }

  private calculateChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  }
}