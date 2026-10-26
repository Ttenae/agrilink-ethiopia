import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ NEW: Get current user's profile (Fixes the 404 Error)
  @Get('me')
  async getMe(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.usersService.findOne(userId);
  }

  // ✅ NEW: Update current user's profile
  @Patch('profile')
  async updateProfile(@Req() req: Request, @Body() updateData: any) {
    const userId = (req.user as any).id;
    return this.usersService.updateProfile(userId, updateData);
  }
}