import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getUsers(@Req() req) {
    return this.usersService.getUsers(req.user.id, req.user.role);
  }

  @Get('me')
  async getProfile(@Req() req) {
    return this.usersService.getProfile(req.user.id);
  }
}