import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  getConversations(@Req() req) {
    return this.chatService.getConversations(req.user.id, req.user.role);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string, @Req() req) {
    return this.chatService.getMessages(id, req.user.id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @Req() req,
    @Body('content') content: string,
  ) {
    return this.chatService.sendMessage(id, req.user.id, content);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  @Post('conversations')
  async createConversation(
    @Req() req,
    @Body() data: { 
      buyerId: string; 
      farmerId: string; 
      transporterId?: string;
    },
  ) {
    return this.chatService.getOrCreateConversation(
      data.buyerId,
      data.farmerId,
      data.transporterId,
    );
  }

  @Get('users/available')
  async getAvailableUsers(@Req() req) {
    return this.chatService.getAvailableUsers(req.user.id, req.user.role);
  }

  @Get('conversations/:id/participants')
  async getConversationParticipants(@Param('id') id: string) {
    return this.chatService.getConversationWithParticipants(id);
  }

  // ==================== NEW ENDPOINTS ====================

  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string, @Req() req) {
    return this.chatService.deleteConversation(id, req.user.id);
  }

  @Delete('conversations/:id/messages')
  async clearMessages(@Param('id') id: string, @Req() req) {
    return this.chatService.clearMessages(id, req.user.id);
  }
}