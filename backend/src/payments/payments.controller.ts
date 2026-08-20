import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('intent')
  async createPaymentIntent(@Req() req, @Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(req.user.id, dto);
  }

  @Get('status/:orderId')
  async getPaymentStatus(@Req() req, @Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId, req.user.id);
  }

  @Get('verify/:txRef')
  async verifyPayment(@Param('txRef') txRef: string) {
    return this.paymentsService.verifyPayment(txRef);
  }

  @Post('commission/:id/paid')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async markCommissionPaid(@Param('id') id: string) {
    return this.paymentsService.markCommissionPaid(id);
  }

  @Get('commissions/summary')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getCommissionsSummary() {
    return this.paymentsService.getCommissionsSummary();
  }

  @Get('commissions/me')
  async getUserCommissions(@Req() req) {
    return this.paymentsService.getUserCommissions(req.user.id);
  }

  @Get('intents')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getAllPaymentIntents() {
    return this.paymentsService.getAllPaymentIntents();
  }

  @Get('transactions')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getAllTransactions() {
    return this.paymentsService.getAllTransactions();
  }

  @Post(':orderId/refund')
  async refundOrder(@Req() req, @Param('orderId') orderId: string) {
    return this.paymentsService.processRefund(orderId, req.user.id);
  }
}