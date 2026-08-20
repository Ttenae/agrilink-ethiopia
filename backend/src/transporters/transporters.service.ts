import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { TransporterStatsDto } from './dto/transporter-stats.dto';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class TransportersService {
  private readonly logger = new Logger(TransportersService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== GET AVAILABLE ORDERS ====================
  async getAvailableOrders(transporterId: string) {
    try {
      // Get orders that are accepted, paid, and don't have a transporter yet
      const availableOrders = await this.prisma.order.findMany({
        where: {
          status: 'ACCEPTED',
          paymentStatus: 'PAID',
          transporterId: null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              location: true,
              imageUrl: true,
            },
          },
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return availableOrders;
    } catch (error) {
      this.logger.error('Error fetching available orders:', error);
      throw error;
    }
  }

  // ==================== GET MY DELIVERIES ====================
  async getMyDeliveries(transporterId: string) {
    try {
      return await this.prisma.order.findMany({
        where: {
          transporterId: transporterId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              location: true,
              imageUrl: true,
            },
          },
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
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Error fetching my deliveries:', error);
      throw error;
    }
  }

  // ==================== ACCEPT ORDER ====================
  async acceptOrder(orderId: string, transporterId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.transporterId) {
        throw new BadRequestException('This order already has a transporter');
      }

      if (order.status !== 'ACCEPTED') {
        throw new BadRequestException('This order is not available for delivery');
      }

      if (order.paymentStatus !== 'PAID') {
        throw new BadRequestException('This order has not been paid yet');
      }

      // Update the order
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          transporterId: transporterId,
          deliveryStatus: 'ASSIGNED',
        },
        include: {
          product: true,
          buyer: true,
          farmer: true,
        },
      });

      this.logger.log(`Transporter ${transporterId} accepted order ${orderId}`);

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error accepting order ${orderId}:`, error);
      throw error;
    }
  }

  // ==================== GET TRANSPORTER DASHBOARD ====================
  async getTransporterDashboard(transporterId: string) {
    try {
      const orders = await this.prisma.order.findMany({
        where: { transporterId },
        include: {
          product: {
            select: {
              name: true,
              category: true,
              imageUrl: true,
              location: true,
            },
          },
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
        orderBy: { createdAt: 'desc' },
      });

      const totalDeliveries = orders.length;
      const completedDeliveries = orders.filter(o => o.deliveryStatus === 'DELIVERED').length;
      const pendingDeliveries = orders.filter(o => o.deliveryStatus === 'PENDING').length;
      const inTransit = orders.filter(o => o.deliveryStatus === 'IN_TRANSIT' || o.deliveryStatus === 'PICKED_UP').length;

      const totalEarnings = orders.reduce((sum, order) => sum + (order.totalPrice * 0.10), 0);

      const recentDeliveries = orders.slice(0, 5);

      return {
        stats: {
          totalDeliveries,
          completedDeliveries,
          pendingDeliveries,
          inTransit,
          totalEarnings,
          pendingEarnings: totalEarnings * 0.5, // Placeholder
          completionRate: totalDeliveries > 0 
            ? Math.round((completedDeliveries / totalDeliveries) * 100) 
            : 0,
        },
        recentDeliveries,
        allOrders: orders,
      };
    } catch (error) {
      this.logger.error('Error fetching transporter dashboard:', error);
      throw error;
    }
  }

  // ==================== UPDATE DELIVERY STATUS ====================
  async updateDeliveryStatus(
    orderId: string,
    transporterId: string,
    dto: UpdateDeliveryStatusDto,
  ) {
    try {
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          transporterId: transporterId,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found or not assigned to you');
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryStatus: dto.status,
          ...(dto.status === 'DELIVERED' && { status: 'COMPLETED' }),
        },
        include: {
          product: true,
          buyer: true,
          farmer: true,
        },
      });

      this.logger.log(`Delivery status updated: Order ${orderId} → ${dto.status}`);

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error updating delivery status for order ${orderId}:`, error);
      throw error;
    }
  }

  // ==================== GET DELIVERY HISTORY ====================
  async getDeliveryHistory(transporterId: string, filters?: any) {
    try {
      const where: any = {
        transporterId,
      };

      if (filters?.status) {
        where.deliveryStatus = filters.status;
      }

      if (filters?.startDate) {
        where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) };
      }

      if (filters?.endDate) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
      }

      return await this.prisma.order.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              category: true,
              imageUrl: true,
              location: true,
            },
          },
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
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Error fetching delivery history:', error);
      throw error;
    }
  }

  // ==================== GET EARNINGS SUMMARY ====================
  async getEarningsSummary(transporterId: string, dto: TransporterStatsDto) {
    try {
      const dateFilter: any = {};
      if (dto.startDate) {
        dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(dto.startDate) };
      }
      if (dto.endDate) {
        dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(dto.endDate) };
      }

      const deliveries = await this.prisma.order.findMany({
        where: {
          transporterId,
          deliveryStatus: 'DELIVERED',
          ...dateFilter,
        },
      });

      const totalEarnings = deliveries.reduce((sum, d) => sum + (d.totalPrice * 0.10), 0);

      return {
        totalEarnings,
        earningsByMonth: {},
        earningsByDay: {},
        totalDeliveries: deliveries.length,
        averageEarningsPerDelivery: deliveries.length > 0 
          ? Math.round((totalEarnings / deliveries.length) * 100) / 100
          : 0,
      };
    } catch (error) {
      this.logger.error('Error fetching earnings summary:', error);
      throw error;
    }
  }

  // ==================== ACCEPT TRANSPORTER REQUEST ====================
  async acceptTransporterRequest(requestId: string, transporterId: string) {
    try {
      // This method would be used if you have a TransporterRequest model
      // For now, return a simple response
      return { success: true, message: 'Request accepted' };
    } catch (error) {
      this.logger.error(`Error accepting transporter request ${requestId}:`, error);
      throw error;
    }
  }

  // ==================== REJECT TRANSPORTER REQUEST ====================
  async rejectTransporterRequest(requestId: string, transporterId: string) {
    try {
      // This method would be used if you have a TransporterRequest model
      // For now, return a simple response
      return { success: true, message: 'Request rejected' };
    } catch (error) {
      this.logger.error(`Error rejecting transporter request ${requestId}:`, error);
      throw error;
    }
  }
}