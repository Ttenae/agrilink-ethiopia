import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyFarmerDto } from './dto/verify-farmer.dto';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== DASHBOARD STATS ====================

  async getDashboardStats() {
    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalCommission,
      pendingCommission,
      paidCommission,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'FARMER' } }),
      this.prisma.user.count({ where: { role: 'BUYER' } }),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.aggregate({ _sum: { totalPrice: true } }),
      this.prisma.payment.aggregate({ _sum: { commissionAmount: true } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'PAID' } }),
    ]);

    // Recent activity (last 10 orders)
    const recentOrders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true, phone: true } },
        farmer: { select: { name: true, phone: true } },
        product: { select: { name: true } },
      },
    });

    // Unverified farmers
    const unverifiedFarmers = await this.prisma.farmerProfile.findMany({
      where: { verified: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            createdAt: true,
          },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return {
      stats: {
        totalUsers,
        totalFarmers,
        totalBuyers,
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        totalCommission: totalCommission._sum.commissionAmount || 0,
        pendingCommission,
        paidCommission,
      },
      recentOrders,
      unverifiedFarmers,
    };
  }

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          farmerProfile: true,
          buyerProfile: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        ordersAsBuyer: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { name: true } },
            farmer: { select: { name: true } },
          },
        },
        ordersAsFarmer: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { name: true } },
            buyer: { select: { name: true } },
          },
        },
        reviewsGiven: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            farmer: { select: { name: true } },
          },
        },
        reviewsReceived: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            buyer: { select: { name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async verifyFarmer(farmerId: string, dto: VerifyFarmerDto) {
    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { userId: farmerId },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    return this.prisma.farmerProfile.update({
      where: { userId: farmerId },
      data: { verified: dto.verified },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot delete admin users');
    }

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  // ==================== PRODUCT MANAGEMENT ====================

  async getAllProducts(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              farmerProfile: {
                select: {
                  verified: true,
                  region: true,
                },
              },
            },
          },
          orders: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.product.count(),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateProductStatus(productId: string, status: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { status: status as any },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  // ==================== ORDER MANAGEMENT ====================

  async getAllOrders(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              price: true,
            },
          },
          payment: true,
          review: true,
        },
      }),
      this.prisma.order.count(),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== COMMISSION MANAGEMENT ====================

  async getAllCommissions(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [commissions, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              buyer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
              farmer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count(),
    ]);

    return {
      data: commissions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCommissionStatus(commissionId: string, dto: UpdateCommissionStatusDto) {
    const commission = await this.prisma.payment.findUnique({
      where: { id: commissionId },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    return this.prisma.payment.update({
      where: { id: commissionId },
      data: { status: dto.status },
      include: {
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            farmer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async getCommissionSummary() {
    const [total, pending, paid, failed] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { commissionAmount: true } }),
      this.prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { commissionAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { commissionAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'FAILED' },
        _sum: { commissionAmount: true },
      }),
    ]);

    return {
      totalCommission: total._sum.commissionAmount || 0,
      pendingCommission: pending._sum.commissionAmount || 0,
      paidCommission: paid._sum.commissionAmount || 0,
      failedCommission: failed._sum.commissionAmount || 0,
    };
  }
}