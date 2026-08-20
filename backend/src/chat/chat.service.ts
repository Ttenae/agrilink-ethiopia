import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string, role: string) {
    const where =
      role === 'FARMER'
        ? { farmerId: userId }
        : role === 'BUYER'
        ? { buyerId: userId }
        : role === 'TRANSPORTER'
        ? { transporterId: userId }
        : {};

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        buyer: {
          select: { id: true, name: true, phone: true },
        },
        farmer: {
          select: { id: true, name: true, phone: true },
        },
        transporter: {
          select: { id: true, name: true, phone: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });
        return { ...conv, unreadCount };
      }),
    );

    return conversationsWithUnread;
  }

  async getOrCreateConversation(buyerId: string, farmerId: string, transporterId?: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        buyerId,
        farmerId,
        transporterId: transporterId || null,
      },
    });

    if (!conversation) {
      const data: any = {
        buyerId,
        farmerId,
      };
      if (transporterId) {
        data.transporterId = transporterId;
      }
      conversation = await this.prisma.conversation.create({
        data,
      });
    }

    return conversation;
  }

  async getConversationWithParticipants(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        buyer: {
          select: { id: true, name: true, phone: true },
        },
        farmer: {
          select: { id: true, name: true, phone: true },
        },
        transporter: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.buyerId !== userId &&
      conversation.farmerId !== userId &&
      conversation.transporterId !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    await this.markMessagesAsRead(conversationId, userId);

    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.buyerId !== senderId &&
      conversation.farmerId !== senderId &&
      conversation.transporterId !== senderId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { farmerId: userId },
          { transporterId: userId },
        ],
      },
    });

    const conversationIds = conversations.map((c) => c.id);

    return this.prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false,
      },
    });
  }

  async getAvailableUsers(userId: string, role: string) {
    let rolesToExclude: string[] = [role];
    
    if (role === 'FARMER') {
      rolesToExclude = ['FARMER'];
    } else if (role === 'BUYER') {
      rolesToExclude = ['BUYER'];
    } else if (role === 'TRANSPORTER') {
      rolesToExclude = ['TRANSPORTER'];
    }

    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        role: { notIn: rolesToExclude as any },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getConversationById(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        buyer: {
          select: { id: true, name: true, phone: true },
        },
        farmer: {
          select: { id: true, name: true, phone: true },
        },
        transporter: {
          select: { id: true, name: true, phone: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.buyerId !== userId &&
      conversation.farmerId !== userId &&
      conversation.transporterId !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderId: { not: userId },
        isRead: false,
      },
    });

    return { ...conversation, unreadCount };
  }

  // ==================== NEW METHODS ====================

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.buyerId !== userId &&
      conversation.farmerId !== userId &&
      conversation.transporterId !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    // Delete all messages first
    await this.prisma.message.deleteMany({
      where: { conversationId },
    });

    // Then delete the conversation
    return this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  async clearMessages(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.buyerId !== userId &&
      conversation.farmerId !== userId &&
      conversation.transporterId !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    return this.prisma.message.deleteMany({
      where: { conversationId },
    });
  }
}