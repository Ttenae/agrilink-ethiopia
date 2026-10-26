import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ✅ RESTORED: This fetches the user for the Profile Page
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove password hash from the response for security
    const { passwordHash, ...result } = user;
    return result;
  }

  // ✅ NEW: Updates the profile
  async updateProfile(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // 1. Update base user details
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
      },
    });

    // 2. Update Farmer Profile if applicable
    if (user.role === 'FARMER' && data.farmerProfile) {
      await this.prisma.farmerProfile.upsert({
        where: { userId },
        update: {
          region: data.farmerProfile.region,
          city: data.farmerProfile.city,
          farmSize: data.farmerProfile.farmSize,
          description: data.farmerProfile.description,
        },
        create: {
          userId,
          region: data.farmerProfile.region || 'Unknown',
          city: data.farmerProfile.city,
          farmSize: data.farmerProfile.farmSize,
          description: data.farmerProfile.description,
        },
      });
    }

    // 3. Update Buyer Profile if applicable
    if (user.role === 'BUYER' && data.buyerProfile) {
      await this.prisma.buyerProfile.upsert({
        where: { userId },
        update: {
          companyName: data.buyerProfile.companyName,
          location: data.buyerProfile.location,
          description: data.buyerProfile.description,
        },
        create: {
          userId,
          companyName: data.buyerProfile.companyName,
          location: data.buyerProfile.location,
          description: data.buyerProfile.description,
        },
      });
    }

    return this.findOne(userId); // Return the updated user
  }
}