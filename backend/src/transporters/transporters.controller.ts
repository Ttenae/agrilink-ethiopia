import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { TransportersService } from './transporters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { TransporterStatsDto } from './dto/transporter-stats.dto';

@Controller('transport')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TRANSPORTER')
export class TransportersController {
  constructor(private transportersService: TransportersService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const transporterId = req.user.id;
    return this.transportersService.getTransporterDashboard(transporterId);
  }

  @Get('available')
  async getAvailableOrders(@Req() req: any) {
    const transporterId = req.user.id;
    return this.transportersService.getAvailableOrders(transporterId);
  }

  @Get('my-deliveries')
  async getMyDeliveries(@Req() req: any) {
    const transporterId = req.user.id;
    return this.transportersService.getMyDeliveries(transporterId);
  }

  @Post('accept/:orderId')
  async acceptOrder(
    @Req() req: any,
    @Param('orderId') orderId: string,
  ) {
    const transporterId = req.user.id;
    return this.transportersService.acceptOrder(orderId, transporterId);
  }

  @Patch('deliveries/:orderId/status')
  async updateDeliveryStatus(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    const transporterId = req.user.id;
    return this.transportersService.updateDeliveryStatus(orderId, transporterId, dto);
  }

  @Get('deliveries/history')
  async getDeliveryHistory(@Req() req: any, @Query() filters: any) {
    const transporterId = req.user.id;
    return this.transportersService.getDeliveryHistory(transporterId, filters);
  }

  @Get('earnings')
  async getEarnings(@Req() req: any, @Query() dto: TransporterStatsDto) {
    const transporterId = req.user.id;
    return this.transportersService.getEarningsSummary(transporterId, dto);
  }

  @Post('requests/:requestId/accept')
  async acceptRequest(@Req() req: any, @Param('requestId') requestId: string) {
    const transporterId = req.user.id;
    return this.transportersService.acceptTransporterRequest(requestId, transporterId);
  }

  @Post('requests/:requestId/reject')
  async rejectRequest(@Req() req: any, @Param('requestId') requestId: string) {
    const transporterId = req.user.id;
    return this.transportersService.rejectTransporterRequest(requestId, transporterId);
  }
}