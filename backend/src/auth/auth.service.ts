import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.phone },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this phone or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user with transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash: hashedPassword,
          role: dto.role,
        },
      });

      // Create role-specific profile
      if (dto.role === 'FARMER') {
        await tx.farmerProfile.create({
          data: {
            userId: newUser.id,
            region: dto.region || '',
            city: dto.city || '',
            farmSize: dto.farmSize ? parseFloat(dto.farmSize) : null,
          },
        });
      } else if (dto.role === 'BUYER') {
        await tx.buyerProfile.create({
          data: {
            userId: newUser.id,
            companyName: dto.companyName || '',
            location: dto.location || '',
          },
        });
      } else if (dto.role === 'TRANSPORTER') {
        await tx.transporterProfile.create({
          data: {
            userId: newUser.id,
            vehicleType: dto.vehicleType || '',
            vehicleCapacity: dto.vehicleCapacity || '',
            licensePlate: dto.licensePlate || '',
            region: dto.region || '',
            city: dto.city || '',
            description: dto.description || '',
          },
        });
      }

      return newUser;
    });

    // Generate JWT
    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    };
  }
}