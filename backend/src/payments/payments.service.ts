import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== CREATE PAYMENT INTENT ====================

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    // Get order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        product: true,
        buyer: true,
        farmer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new BadRequestException('You can only pay for your own orders');
    }

    // ✅ CRITICAL: Farmer MUST accept BEFORE payment
    if (order.status !== 'ACCEPTED') {
      throw new BadRequestException(
        '⛔ This order must be accepted by the farmer before you can pay'
      );
    }

    // ✅ Use type assertion for paymentStatus check
    if ((order as any).paymentStatus === 'PAID') {
      throw new BadRequestException('This order has already been paid');
    }

    // Check if payment intent already exists
    const existingIntent = await this.prisma.paymentIntent.findUnique({
      where: { orderId: order.id },
    });

    if (existingIntent) {
      if (existingIntent.status === 'EXPIRED' || existingIntent.status === 'FAILED') {
        await this.prisma.paymentIntent.delete({
          where: { id: existingIntent.id },
        });
      } else {
        return {
          ...existingIntent,
          message: 'Payment intent already exists',
          checkoutUrl: existingIntent.checkoutUrl,
        };
      }
    }

    // Generate unique reference
    const txRef = `AGR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create payment intent
    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        order: { connect: { id: order.id } },
        user: { connect: { id: userId } },
        amount: order.totalPrice,
        status: 'CREATED',
        provider: 'CHAPA',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        transactions: {
          create: {
            userId: userId,
            orderId: order.id,
            amount: order.totalPrice,
            type: 'PAYMENT',
            status: 'PENDING',
            reference: txRef,
            description: `Payment for order #${order.id.slice(0, 8)}`,
          },
        },
      },
      include: {
        transactions: true,
      },
    });

    // Initialize Chapa payment
    const chapaResponse = await this.initializeChapaPayment(
      order,
      paymentIntent,
      txRef,
      dto.returnUrl,
    );

    return {
      paymentIntent,
      checkoutUrl: chapaResponse?.data?.checkout_url || null,
      txRef,
    };
  }

  // ==================== CHAPA INTEGRATION ====================

  async initializeChapaPayment(order: any, paymentIntent: any, txRef: string, returnUrl?: string) {
    try {
      const payload = {
        amount: order.totalPrice.toString(),
        currency: 'ETB',
        email: order.buyer.email || 'customer@agrilink.com',
        first_name: order.buyer.name || 'Customer',
        last_name: order.buyer.name || 'Customer',
        tx_ref: txRef,
        callback_url: `${process.env.CHAPA_CALLBACK_URL}/payments/webhook/chapa`,
        return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
        customizations: {
          title: 'AgriLink Ethiopia',
          description: `Payment for order #${order.id.slice(0, 8)}`,
          logo: `${process.env.FRONTEND_URL}/logo.png`,
        },
      };

      const response = await axios.post(
        'https://api.chapa.co/v1/transaction/initialize',
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data?.data?.checkout_url) {
        await this.prisma.paymentIntent.update({
          where: { id: paymentIntent.id },
          data: {
            checkoutUrl: response.data.data.checkout_url,
            status: 'PENDING',
          },
        });
      }

      return response.data;
    } catch (error) {
      this.logger.error('Chapa initialization error:', error.message);
      
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { status: 'FAILED' },
      });

      throw new BadRequestException('Payment initialization failed');
    }
  }

  // ==================== WEBHOOK HANDLER ====================

  async handleChapaWebhook(body: any) {
    try {
      const { tx_ref, status, amount } = body;

      const transaction = await this.prisma.transaction.findFirst({
        where: { reference: tx_ref },
        include: {
          order: true,
          paymentIntent: true,
        },
      });

      if (!transaction) {
        this.logger.error('Transaction not found for reference:', tx_ref);
        return { success: false, message: 'Transaction not found' };
      }

      if (Math.abs(transaction.amount - amount) > 0.01) {
        this.logger.error('Amount mismatch:', transaction.amount, amount);
        return { success: false, message: 'Amount mismatch' };
      }

      if (status === 'success') {
        await this.handleSuccessfulPayment(transaction);
      } else {
        await this.handleFailedPayment(transaction);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Webhook handling error:', error);
      return { success: false, message: error.message };
    }
  }

  // ==================== VERIFY PAYMENT ====================

  async verifyPayment(txRef: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { reference: txRef },
      include: {
        order: true,
        paymentIntent: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      orderId: transaction.orderId,
      status: transaction.status,
      amount: transaction.amount,
      paymentIntentId: transaction.paymentIntentId,
    };
  }

  // ==================== PAYMENT SUCCESS HANDLER ====================

  async handleSuccessfulPayment(transaction: any) {
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'SUCCEEDED' },
    });

    await this.prisma.paymentIntent.update({
      where: { id: transaction.paymentIntentId },
      data: { status: 'SUCCEEDED' },
    });

    // ✅ Use type assertion for paymentStatus
    const order = await this.prisma.order.update({
      where: { id: transaction.orderId },
      data: { 
        status: 'ACCEPTED',  // Keep as ACCEPTED
        paymentStatus: 'PAID'  // ✅ Set payment status to PAID
      } as any,  // ✅ Type assertion
    });

    await this.createCommission(order.id);

    const commissionAmount = order.totalPrice * 0.03;
    await this.prisma.transaction.create({
      data: {
        userId: order.farmerId,
        orderId: order.id,
        paymentIntentId: transaction.paymentIntentId,
        amount: commissionAmount,
        type: 'COMMISSION_PAYOUT',
        status: 'PENDING',
        reference: `COMM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        description: `Commission for order #${order.id.slice(0, 8)} (3%)`,
      },
    });

    this.logger.log(`Payment successful for order: ${order.id}`);
    return { success: true, orderId: order.id };
  }

  // ==================== PAYMENT FAILED HANDLER ====================

  async handleFailedPayment(transaction: any) {
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' },
    });

    await this.prisma.paymentIntent.update({
      where: { id: transaction.paymentIntentId },
      data: { status: 'FAILED' },
    });

    // ✅ Use type assertion for paymentStatus
    await this.prisma.order.update({
      where: { id: transaction.orderId },
      data: { 
        status: 'CANCELLED',
        paymentStatus: 'FAILED'  // ✅ Set payment status to FAILED
      } as any,  // ✅ Type assertion
    });

    this.logger.warn(`Payment failed for order: ${transaction.orderId}`);
    return { success: true };
  }

  // ==================== COMMISSION ====================

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

  // ==================== GET PAYMENT STATUS ====================

  async getPaymentStatus(orderId: string, userId: string) {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { orderId },
      include: {
        transactions: true,
        order: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
              },
            },
            product: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (paymentIntent.order.buyerId !== userId) {
      throw new BadRequestException('You can only view your own payments');
    }

    const commission = await this.prisma.commission.findUnique({
      where: { orderId },
    });

    return {
      paymentIntent,
      commission,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      checkoutUrl: paymentIntent.checkoutUrl,
      expiresAt: paymentIntent.expiresAt,
    };
  }

  // ==================== ADMIN: MARK COMMISSION PAID ====================

  async markCommissionPaid(commissionId: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { id: commissionId },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    if (commission.status === 'PAID') {
      throw new BadRequestException('Commission already paid');
    }

    return this.prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentRef: `PAID-${Date.now()}`,
      },
    });
  }

  // ==================== GET COMMISSIONS SUMMARY ====================

  async getCommissionsSummary() {
    const [total, pending, paid] = await Promise.all([
      this.prisma.commission.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.commission.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.commission.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCommission: total._sum.amount || 0,
      pendingCommission: pending._sum.amount || 0,
      paidCommission: paid._sum.amount || 0,
    };
  }

  // ==================== GET USER COMMISSIONS ====================

  async getUserCommissions(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { farmerId: userId },
      select: { id: true },
    });

    const orderIds = orders.map(o => o.id);

    return this.prisma.commission.findMany({
      where: { orderId: { in: orderIds } },
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
            product: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== REFUND ====================

  async processRefund(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentIntent: true,
        transactions: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new BadRequestException('You can only refund your own orders');
    }

    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed orders can be refunded');
    }

    const paymentIntent = order.paymentIntent;
    if (!paymentIntent) {
      throw new BadRequestException('No payment found for this order');
    }

    const existingRefund = await this.prisma.transaction.findFirst({
      where: {
        orderId,
        type: 'REFUND',
        status: 'SUCCEEDED',
      },
    });

    if (existingRefund) {
      throw new BadRequestException('This order has already been refunded');
    }

    const refund = await this.prisma.transaction.create({
      data: {
        userId: userId,
        orderId: order.id,
        paymentIntentId: paymentIntent.id,
        amount: order.totalPrice,
        type: 'REFUND',
        status: 'PENDING',
        reference: `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        description: `Refund for order #${order.id.slice(0, 8)}`,
      },
    });

    // ✅ Use type assertion for paymentStatus
    await this.prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED'  // ✅ Set payment status to REFUNDED
      } as any,  // ✅ Type assertion
    });

    this.logger.log(`Refund processed for order: ${orderId}`);
    return refund;
  }

  // ==================== ADMIN: GET ALL PAYMENT INTENTS ====================

  async getAllPaymentIntents() {
    return this.prisma.paymentIntent.findMany({
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
                name: true,
                category: true,
              },
            },
          },
        },
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== ADMIN: GET ALL TRANSACTIONS ====================

  async getAllTransactions() {
    return this.prisma.transaction.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        order: {
          include: {
            product: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}