import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ... your existing routes ...

  // ✅ ADD THIS NEW ROUTE
  @Patch('profile')
  async updateProfile(@Req() req: Request, @Body() updateData: any) {
    const userId = (req.user as any).id;
    return this.usersService.updateProfile(userId, updateData);
  }
}