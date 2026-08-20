import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(userId: string, userRole: string) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        email: true,
        createdAt: true,
        farmerProfile: {
          select: {
            region: true,
            city: true,
            verified: true,
          },
        },
        buyerProfile: {
          select: {
            companyName: true,
            location: true,
          },
        },
        transporterProfile: {
          select: {
            vehicleType: true,
            vehicleCapacity: true,
            licensePlate: true,
            region: true,
            city: true,
            verified: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      data: users,
      total: users.length,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
        farmerProfile: {
          select: {
            region: true,
            city: true,
            farmSize: true,
            description: true,
            verified: true,
          },
        },
        buyerProfile: {
          select: {
            companyName: true,
            location: true,
            description: true,
          },
        },
        transporterProfile: {
          select: {
            vehicleType: true,
            vehicleCapacity: true,
            licensePlate: true,
            region: true,
            city: true,
            description: true,
            verified: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}