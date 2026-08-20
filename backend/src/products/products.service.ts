import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  async create(farmerId: string, dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          ...dto,
          farmerId,
        },
      });
    } catch (error) {
      this.logger.error('Error creating product:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              farmerProfile: {
                select: {
                  region: true,
                  city: true,
                  verified: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Error finding all products:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              farmerProfile: {
                select: {
                  region: true,
                  city: true,
                  verified: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    } catch (error) {
      this.logger.error(`Error finding product ${id}:`, error);
      throw error;
    }
  }

  async findByFarmer(farmerId: string) {
    try {
      return await this.prisma.product.findMany({
        where: { farmerId },
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              farmerProfile: {
                select: {
                  region: true,
                  city: true,
                  verified: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error finding products for farmer ${farmerId}:`, error);
      throw error;
    }
  }

  async update(id: string, farmerId: string, dto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.farmerId !== farmerId) {
        throw new ForbiddenException('You can only update your own products');
      }

      return await this.prisma.product.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      this.logger.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  // ✅ FIXED: Delete method with proper error handling
  async remove(id: string, farmerId: string) {
    try {
      this.logger.log(`Attempting to delete product ${id} by farmer ${farmerId}`);

      // First check if product exists
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          orders: {
            select: { id: true },
          },
        },
      });

      if (!product) {
        this.logger.warn(`Product ${id} not found`);
        throw new NotFoundException('Product not found');
      }

      // Check ownership
      if (product.farmerId !== farmerId) {
        this.logger.warn(`Farmer ${farmerId} tried to delete product ${id} owned by ${product.farmerId}`);
        throw new ForbiddenException('You can only delete your own products');
      }

      // Check if product has orders
      if (product.orders && product.orders.length > 0) {
        this.logger.log(`Product ${id} has ${product.orders.length} orders - marking as INACTIVE`);
        return await this.prisma.product.update({
          where: { id },
          data: { status: 'INACTIVE' },
        });
      }

      // If no orders, hard delete
      this.logger.log(`Deleting product ${id} permanently`);
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error deleting product ${id}:`, error);
      // Re-throw the error with more context
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete product: ${error.message}`);
    }
  }

  async search(query: string) {
    try {
      return await this.prisma.product.findMany({
        where: {
          AND: [
            { status: 'ACTIVE' },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              farmerProfile: {
                select: {
                  region: true,
                  city: true,
                  verified: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error searching products with query ${query}:`, error);
      throw error;
    }
  }

  async filterByCategory(category: string) {
    try {
      return await this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          category: { equals: category, mode: 'insensitive' },
        },
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              farmerProfile: {
                select: {
                  region: true,
                  city: true,
                  verified: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error filtering products by category ${category}:`, error);
      throw error;
    }
  }

  async filterByLocation(location: string) {
    try {
      return await this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          location: { contains: location, mode: 'insensitive' },
        },
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              farmerProfile: {
                select: {
                  region: true,
                  city: true,
                  verified: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error filtering products by location ${location}:`, error);
      throw error;
    }
  }
}