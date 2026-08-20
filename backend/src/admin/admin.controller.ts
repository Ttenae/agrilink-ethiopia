import { Controller, Get, Post, Body, Param, Query, Delete, UseGuards, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { VerifyFarmerDto } from './dto/verify-farmer.dto';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ==================== USER MANAGEMENT ====================

  @Get('users')
  getAllUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getAllUsers(pageNum, limitNum);
  }

  @Get('users/:id')
  getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Put('farmers/:id/verify')
  verifyFarmer(@Param('id') id: string, @Body() dto: VerifyFarmerDto) {
    return this.adminService.verifyFarmer(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ==================== PRODUCT MANAGEMENT ====================

  @Get('products')
  getAllProducts(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getAllProducts(pageNum, limitNum);
  }

  @Put('products/:id/status')
  updateProductStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateProductStatus(id, status);
  }

  // ==================== ORDER MANAGEMENT ====================

  @Get('orders')
  getAllOrders(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getAllOrders(pageNum, limitNum);
  }

  // ==================== COMMISSION MANAGEMENT ====================

  @Get('commissions')
  getAllCommissions(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getAllCommissions(pageNum, limitNum);
  }

  @Get('commissions/summary')
  getCommissionSummary() {
    return this.adminService.getCommissionSummary();
  }

  @Put('commissions/:id/status')
  updateCommissionStatus(@Param('id') id: string, @Body() dto: UpdateCommissionStatusDto) {
    return this.adminService.updateCommissionStatus(id, dto);
  }
}