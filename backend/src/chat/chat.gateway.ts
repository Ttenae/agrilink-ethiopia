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
import { PrismaService } from '../prisma/prisma.service';

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
    private prisma: PrismaService,
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
      // 1. Save the message
      const message = await this.chatService.sendMessage(
        data.conversationId,
        data.senderId,
        data.content,
      );

      // 2. Get conversation to find participants
      const conversation = await this.chatService.getConversationWithParticipants(
        data.conversationId,
      );

      // ✅ 3. Correctly identify the receiver
      let receiverId: string | null = null;
      
      if (conversation.buyerId === data.senderId) {
        receiverId = conversation.farmerId;
      } else if (conversation.farmerId === data.senderId) {
        receiverId = conversation.buyerId;
      } else if (conversation.transporterId === data.senderId) {
        receiverId = conversation.buyerId || conversation.farmerId;
      }

      // 4. Save Notification for the receiver
      if (receiverId) {
        await this.prisma.notification.create({
          data: {
            userId: receiverId,
            title: '💬 New Message',
            message: `New message from ${message.sender.name}: "${data.content.substring(0, 30)}..."`,
            type: 'MESSAGE',
          },
        });
        console.log(`✅ Notification saved for user: ${receiverId}`);
      }

      // 5. Send message to the room
      this.server.to(`conversation-${data.conversationId}`).emit('new-message', message);

      // 6. Update unread counts for all participants
      const participants = [
        conversation.buyerId,
        conversation.farmerId,
        conversation.transporterId,
      ].filter(Boolean);

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