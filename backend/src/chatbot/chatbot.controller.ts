import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async sendMessage(@Body() body: { message: string, language: string }, @Req() req: any) {
    return this.chatbotService.handleMessage(req.user.id, body.message, body.language);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.chatbotService.getHistory(req.user.id);
  }
}