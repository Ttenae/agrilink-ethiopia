import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(buyerId: string, dto: CreateReviewDto) {
    // Check if order exists and is completed
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify the order belongs to this buyer
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only review your own orders');
    }

    // Only completed orders can be reviewed
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed orders can be reviewed');
    }

    // Check if review already exists
    const existingReview = await this.prisma.review.findUnique({
      where: { orderId: dto.orderId },
    });

    if (existingReview) {
      throw new BadRequestException('This order has already been reviewed');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        buyerId: buyerId,
        farmerId: order.farmerId,
        rating: dto.rating,
        comment: dto.comment,
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
        order: {
          select: {
            id: true,
            product: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Update farmer's average rating
    await this.updateFarmerRating(order.farmerId);

    return review;
  }

  async findAll() {
    return this.prisma.review.findMany({
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
        order: {
          select: {
            id: true,
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

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
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
        order: {
          select: {
            id: true,
            product: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async findByFarmer(farmerId: string) {
    return this.prisma.review.findMany({
      where: { farmerId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
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

  async findByBuyer(buyerId: string) {
    return this.prisma.review.findMany({
      where: { buyerId },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
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

  async getFarmerRating(farmerId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { farmerId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return {
        farmerId,
        averageRating: 0,
        totalReviews: 0,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      };
    }

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = total / reviews.length;

    // Count ratings by star
    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      ratings[r.rating as keyof typeof ratings]++;
    });

    return {
      farmerId,
      averageRating: parseFloat(average.toFixed(2)),
      totalReviews: reviews.length,
      ratings,
    };
  }

  private async updateFarmerRating(farmerId: string) {
    const stats = await this.getFarmerRating(farmerId);
    
    // Update farmer profile with average rating
    await this.prisma.farmerProfile.update({
      where: { userId: farmerId },
      data: {
        // You can add an averageRating field to FarmerProfile if you want
        // For now, we'll just return the stats
      },
    });

    return stats;
  }

  async remove(id: string, userId: string, role: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only buyer who wrote it or admin can delete
    if (role !== 'ADMIN' && review.buyerId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const deleted = await this.prisma.review.delete({
      where: { id },
    });

    // Update farmer rating
    await this.updateFarmerRating(review.farmerId);

    return deleted;
  }
}