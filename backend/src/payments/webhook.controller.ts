import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Response } from 'express';

@Controller('payments/webhook')
export class WebhookController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('chapa')
  async handleChapaWebhook(
    @Body() body: any,
    @Headers('chapa-signature') signature: string,
    @Res() res: Response,
  ) {
    try {
      console.log('📩 Webhook received:', body);
      
      const result = await this.paymentsService.handleChapaWebhook(body);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Webhook error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}