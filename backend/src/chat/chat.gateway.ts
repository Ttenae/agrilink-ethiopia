import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.connectedUsers.set(userId, client.id);
      client.data.userId = userId;

      console.log(`✅ User ${userId} connected to chat`);

      const unreadCount = await this.chatService.getUnreadCount(userId);
      client.emit('unread-count', unreadCount);
    } catch (error) {
      console.error('❌ Connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`❌ User ${userId} disconnected from chat`);
    }
  }

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation-${data.conversationId}`);
    return { success: true, conversationId: data.conversationId };
  }

  @SubscribeMessage('leave-conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation-${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      conversationId: string;
      content: string;
      senderId: string;
    },
  ) {
    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        data.senderId,
        data.content,
      );

      // Get conversation to find participants
      const conversation = await this.chatService.getConversationWithParticipants(
        data.conversationId,
      );

      // Get all participants
      const participants = [
        conversation.buyerId,
        conversation.farmerId,
        conversation.transporterId,
      ].filter(Boolean);

      // Send to ALL participants including sender
      // BUT the frontend will handle deduplication
      this.server.to(`conversation-${data.conversationId}`).emit('new-message', message);

      // Send unread count updates to all participants
      for (const participantId of participants) {
        const socketId = this.connectedUsers.get(participantId);
        if (socketId) {
          const unreadCount = await this.chatService.getUnreadCount(participantId);
          this.server.to(socketId).emit('unread-count', unreadCount);
        }
      }

      return { success: true, message };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    await this.chatService.markMessagesAsRead(data.conversationId, data.userId);
    const unreadCount = await this.chatService.getUnreadCount(data.userId);
    client.emit('unread-count', unreadCount);
    return { success: true };
  }
}