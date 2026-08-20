import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ==================== CREATE ORDER ====================

  async create(buyerId: string, dto: CreateOrderDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('Product is not available');
    }

    if (product.farmerId === buyerId) {
      throw new ForbiddenException('You cannot order your own product');
    }

    if (product.quantity < dto.quantity) {
      throw new BadRequestException(`Only ${product.quantity} ${product.unit} available`);
    }

    const totalPrice = product.price * dto.quantity;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          buyerId,
          farmerId: product.farmerId,
          productId: product.id,
          quantity: dto.quantity,
          totalPrice,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
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
              unit: true,
              imageUrl: true,
            },
          },
        },
      });

      // Update product quantity
      await tx.product.update({
        where: { id: product.id },
        data: {
          quantity: product.quantity - dto.quantity,
          status: product.quantity - dto.quantity === 0 ? 'SOLD' : 'ACTIVE',
        },
      });

      return newOrder;
    });

    return order;
  }

  // ==================== RESTORE PRODUCT QUANTITY ====================

  async restoreProductQuantity(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: order.productId },
    });

    if (product) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          quantity: product.quantity + order.quantity,
          status: 'ACTIVE',
        },
      });
    }

    return { success: true };
  }

  // ==================== GET ALL ORDERS ====================

  async findAll() {
    return this.prisma.order.findMany({
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
        transporter: {
          select: {
            id: true,
            name: true,
            phone: true,
            transporterProfile: {
              select: {
                vehicleType: true,
                licensePlate: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            unit: true,
            imageUrl: true,
            location: true,
          },
        },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== FIND ONE ORDER ====================

  async findOne(id: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
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
        transporter: {
          select: {
            id: true,
            name: true,
            phone: true,
            transporterProfile: {
              select: {
                vehicleType: true,
                licensePlate: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            price: true,
            unit: true,
            imageUrl: true,
            location: true,
          },
        },
        payment: true,
        review: {
          include: {
            buyer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole !== 'ADMIN' && order.buyerId !== userId && order.farmerId !== userId && order.transporterId !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  // ==================== FIND BY BUYER ====================

  async findByBuyer(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        transporter: {
          select: {
            id: true,
            name: true,
            phone: true,
            transporterProfile: {
              select: {
                vehicleType: true,
                licensePlate: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            unit: true,
            imageUrl: true,
            location: true,
          },
        },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== FIND BY FARMER ====================

  async findByFarmer(farmerId: string) {
    return this.prisma.order.findMany({
      where: { farmerId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        transporter: {
          select: {
            id: true,
            name: true,
            phone: true,
            transporterProfile: {
              select: {
                vehicleType: true,
                licensePlate: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            unit: true,
            imageUrl: true,
            location: true,
          },
        },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== FIND BY TRANSPORTER ====================

  async findByTransporter(transporterId: string) {
    return this.prisma.order.findMany({
      where: { transporterId },
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
            unit: true,
            imageUrl: true,
            location: true,
          },
        },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== UPDATE ORDER STATUS ====================

  async updateStatus(id: string, userId: string, role: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Permission checks
    if (role === 'FARMER' && order.farmerId !== userId) {
      throw new ForbiddenException('You can only update orders for your products');
    }

    if (role === 'BUYER' && order.buyerId !== userId) {
      throw new ForbiddenException('You can only update your own orders');
    }

    if (role === 'TRANSPORTER' && order.transporterId !== userId) {
      throw new ForbiddenException('You can only update delivery status for your assigned orders');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED: ['COMPLETED', 'CANCELLED'],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status]?.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    // Role-specific validations
    if (role === 'FARMER' && !['ACCEPTED', 'REJECTED'].includes(dto.status)) {
      throw new ForbiddenException('Farmers can only accept or reject orders');
    }

    if (role === 'BUYER' && !['CANCELLED'].includes(dto.status)) {
      throw new ForbiddenException('Buyers can only cancel orders');
    }

    if (role === 'TRANSPORTER' && !['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'].includes(dto.status)) {
      throw new ForbiddenException('Transporters can only update delivery status');
    }

    // If order is being cancelled or rejected, restore product quantity
    if (dto.status === 'CANCELLED' || dto.status === 'REJECTED') {
      await this.restoreProductQuantity(id);
    }

    // Update order
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        paymentStatus: dto.status === 'COMPLETED' ? 'PAID' : order.paymentStatus,
      },
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
        transporter: {
          select: {
            id: true,
            name: true,
            phone: true,
            transporterProfile: {
              select: {
                vehicleType: true,
                licensePlate: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            unit: true,
            imageUrl: true,
            location: true,
          },
        },
        payment: true,
        review: true,
      },
    });

    // Create commission when order is completed
    if (dto.status === 'COMPLETED') {
      await this.createCommission(updatedOrder.id);
    }

    return updatedOrder;
  }

  // ==================== DELETE ORDER ====================

  async remove(id: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN') {
      if (order.buyerId !== userId && order.farmerId !== userId) {
        throw new ForbiddenException('You can only delete your own orders');
      }
    }

    // Only allow deletion of PENDING orders
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only pending orders can be deleted');
    }

    // Check if order is paid
    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Cannot delete a paid order');
    }

    // Restore product quantity before deleting
    await this.restoreProductQuantity(id);

    return this.prisma.order.delete({
      where: { id },
    });
  }

  // ==================== CREATE COMMISSION ====================

  async createCommission(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const commissionAmount = order.totalPrice * 0.03;

    return this.prisma.commission.create({
      data: {
        orderId: order.id,
        amount: commissionAmount,
        rate: 0.03,
        status: 'PENDING',
      },
    });
  }

  // ==================== GET COMMISSION ====================

  async getCommission(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole !== 'ADMIN' && order.buyerId !== userId && order.farmerId !== userId && order.transporterId !== userId) {
      throw new ForbiddenException('You can only view commissions for your own orders');
    }

    const commission = await this.prisma.commission.findUnique({
      where: { orderId },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found for this order');
    }

    return commission;
  }

  // ==================== ASSIGN TRANSPORTER ====================

  async assignTransporter(orderId: string, transporterId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'ACCEPTED') {
      throw new BadRequestException('Order must be accepted before assigning a transporter');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new BadRequestException('Order must be paid before assigning a transporter');
    }

    const transporter = await this.prisma.transporterProfile.findUnique({
      where: { userId: transporterId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!transporter) {
      throw new NotFoundException('Transporter not found');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        transporterId: transporter.userId,
        deliveryStatus: 'ASSIGNED',
      },
      include: {
        buyer: { select: { name: true, phone: true } },
        farmer: { select: { name: true, phone: true } },
        transporter: {
          select: {
            name: true,
            phone: true,
            transporterProfile: {
              select: {
                vehicleType: true,
                licensePlate: true,
              },
            },
          },
        },
        product: { select: { name: true, unit: true, price: true, location: true } },
      },
    });
  }

  // ==================== UPDATE DELIVERY STATUS ====================

  async updateDeliveryStatus(orderId: string, userId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.transporterId !== userId) {
      throw new ForbiddenException('You can only update delivery status for your assigned orders');
    }

    const validStatuses = ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid delivery status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: status as any,
        status: status === 'DELIVERED' ? 'COMPLETED' : order.status,
      },
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
        transporter: {
          select: {
            id: true,
            name: true,
            phone: true,
            transporterProfile: {
              select: {
                vehicleType: true,
                licensePlate: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
            price: true,
            location: true,
          },
        },
      },
    });

    return updatedOrder;
  }
}