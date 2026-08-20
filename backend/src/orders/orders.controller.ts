import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // ==================== CREATE ORDER ====================
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateOrderDto) {
    const userId = (req.user as any).id;
    return this.ordersService.create(userId, dto);
  }

  // ==================== GET ALL ORDERS ====================
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.ordersService.findAll();
  }

  // ==================== GET BUYER ORDERS ====================
  @Get('buyer')
  async findByBuyer(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.findByBuyer(userId);
  }

  // ==================== GET FARMER ORDERS ====================
  @Get('farmer')
  async findByFarmer(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.findByFarmer(userId);
  }

  // ==================== GET TRANSPORTER ORDERS ====================
  @Get('transporter')
  async findByTransporter(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ordersService.findByTransporter(userId);
  }

  // ==================== GET SINGLE ORDER ====================
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req.user as any);
    return this.ordersService.findOne(id, user.id, user.role);
  }

  // ==================== UPDATE ORDER STATUS ====================
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const user = (req.user as any);
    return this.ordersService.updateStatus(id, user.id, user.role, dto);
  }

  // ==================== DELETE ORDER ====================
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req.user as any);
    return this.ordersService.remove(id, user.id, user.role);
  }

  // ==================== ASSIGN TRANSPORTER ====================
  @Patch(':id/assign-transporter')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FARMER')
  async assignTransporter(
    @Param('id') id: string,
    @Body('transporterId') transporterId: string,
  ) {
    return this.ordersService.assignTransporter(id, transporterId);
  }

  // ==================== UPDATE DELIVERY STATUS ====================
  @Patch(':id/delivery-status')
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body('status') status: string,
  ) {
    const userId = (req.user as any).id;
    return this.ordersService.updateDeliveryStatus(id, userId, status);
  }

  // ==================== GET COMMISSION ====================
  @Get(':id/commission')
  async getCommission(@Param('id') id: string, @Req() req: Request) {
    const user = (req.user as any);
    return this.ordersService.getCommission(id, user.id, user.role);
  }
}