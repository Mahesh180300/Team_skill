import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage) private chatRepo: Repository<ChatMessage>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async getContacts(currentUser: any) {
    if (currentUser.role === 'admin') {
      const employees = await this.usersRepo.find({
        where: { role: 'employee' },
        order: { createdAt: 'DESC' },
      });

      const messages = await this.chatRepo
        .createQueryBuilder('msg')
        .where('(msg.senderId = :me AND msg.deletedBySender = false) OR (msg.receiverId = :me AND msg.deletedByReceiver = false)', { me: currentUser.id })
        .orderBy('msg.createdAt', 'DESC')
        .getMany();

      const latestByOther = new Map();
      const unreadByOther = new Map();
      for (const msg of messages) {
        const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
        if (!latestByOther.has(otherId)) {
          latestByOther.set(otherId, msg);
        }
        if (msg.receiverId === currentUser.id && !msg.isRead) {
          unreadByOther.set(otherId, (unreadByOther.get(otherId) || 0) + 1);
        }
      }

      const sorted = employees
        .map(({ password, ...rest }) => {
          const lastMsg = latestByOther.get(rest.id) || null;
          return {
            ...rest,
            lastMessage: lastMsg ? lastMsg.content : null,
            lastMessageAt: lastMsg ? lastMsg.createdAt : null,
            lastMessageSenderId: lastMsg ? lastMsg.senderId : null,
            _unreadCount: unreadByOther.get(rest.id) || 0,
          };
        })
        .sort((a, b) => {
          if (!a.lastMessageAt && !b.lastMessageAt) return 0;
          if (!a.lastMessageAt) return 1;
          if (!b.lastMessageAt) return -1;
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });

      return sorted.map(({ _unreadCount, ...rest }) => ({ ...rest, unreadCount: _unreadCount }));
    }

    const admin = await this.usersRepo.findOne({ where: { role: 'admin' } });
    if (!admin) return [];

    const messages = await this.chatRepo
      .createQueryBuilder('msg')
      .where('(msg.senderId = :me AND msg.deletedBySender = false) OR (msg.senderId = :adminId AND msg.receiverId = :me AND msg.deletedByReceiver = false)', { me: currentUser.id, adminId: admin.id })
      .orderBy('msg.createdAt', 'DESC')
      .getMany();

    const latest = messages[0] || null;
    const unreadCount = messages.filter((m) => m.receiverId === currentUser.id && !m.isRead).length;

    const { password, ...rest } = admin;
    return [{
      ...rest,
      lastMessage: latest ? latest.content : null,
      lastMessageAt: latest ? latest.createdAt : null,
      lastMessageSenderId: latest ? latest.senderId : null,
      unreadCount,
    }];
  }

  async getMessages(currentUser: any, otherUserId: string) {
    if (!otherUserId) throw new BadRequestException('otherUserId is required');

    if (currentUser.role !== 'admin' && otherUserId !== currentUser.id) {
      const target = await this.usersRepo.findOne({ where: { id: otherUserId } });
      if (!target || target.role !== 'admin') {
        throw new ForbiddenException('You can only view messages with admin');
      }
    }

    const messages = await this.chatRepo
      .createQueryBuilder('msg')
      .where('(msg.senderId = :me AND msg.receiverId = :other AND msg.deletedBySender = false) OR (msg.senderId = :other AND msg.receiverId = :me AND msg.deletedByReceiver = false)', {
        me: currentUser.id,
        other: otherUserId,
      })
      .orderBy('msg.createdAt', 'ASC')
      .getMany();

    await this.chatRepo
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ isRead: true })
      .where('receiverId = :me', { me: currentUser.id })
      .andWhere('senderId = :other', { other: otherUserId })
      .andWhere('isRead = false')
      .andWhere('deletedByReceiver = false')
      .execute();

    return messages.map(({ id, senderId, receiverId, content, isRead, createdAt }) => ({
      id,
      senderId,
      receiverId,
      content,
      isRead,
      createdAt,
    }));
  }

  async sendMessage(currentUser: any, otherUserId: string, content: string) {
    if (!otherUserId || !content?.trim()) {
      throw new BadRequestException('Receiver and message content are required');
    }

    const target = await this.usersRepo.findOne({ where: { id: otherUserId } });
    if (!target) throw new BadRequestException('Receiver not found');

    if (currentUser.role !== 'admin') {
      if (target.role !== 'admin') {
        throw new ForbiddenException('Employees can only message admin');
      }
    }

    const message = this.chatRepo.create({
      senderId: currentUser.id,
      receiverId: otherUserId,
      content: content.trim(),
      isRead: false,
      deletedBySender: false,
      deletedByReceiver: false,
    });

    await this.chatRepo.save(message);
    return {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }

  async markAsRead(currentUser: any, otherUserId: string) {
    await this.chatRepo
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ isRead: true })
      .where('receiverId = :me', { me: currentUser.id })
      .andWhere('senderId = :other', { other: otherUserId })
      .andWhere('isRead = false')
      .andWhere('deletedByReceiver = false')
      .execute();

    return { success: true };
  }

  async updateMessage(currentUser: any, messageId: string, content: string) {
    if (!content?.trim()) throw new BadRequestException('Content cannot be empty');

    const message = await this.chatRepo.findOne({ where: { id: messageId } });
    if (!message) throw new BadRequestException('Message not found');
    if (message.senderId !== currentUser.id) throw new ForbiddenException('You can only edit your own messages');

    message.content = content.trim();
    await this.chatRepo.save(message);
    return { id: message.id, senderId: message.senderId, receiverId: message.receiverId, content: message.content, isRead: message.isRead, createdAt: message.createdAt };
  }

  async deleteMessage(currentUser: any, messageId: string) {
    const message = await this.chatRepo.findOne({ where: { id: messageId } });
    if (!message) throw new BadRequestException('Message not found');
    if (message.senderId !== currentUser.id && message.receiverId !== currentUser.id) {
      throw new ForbiddenException('You can only delete messages in your conversation');
    }

    if (message.senderId === currentUser.id) {
      message.deletedBySender = true;
    } else if (message.receiverId === currentUser.id) {
      message.deletedByReceiver = true;
    }

    if (message.deletedBySender && message.deletedByReceiver) {
      await this.chatRepo.remove(message);
    } else {
      await this.chatRepo.save(message);
    }

    return { success: true };
  }

  async getUnreadCount(currentUser: any) {
    if (currentUser.role === 'admin') {
      const count = await this.chatRepo
        .createQueryBuilder('msg')
        .where('msg.receiverId = :me', { me: currentUser.id })
        .andWhere('msg.isRead = false')
        .andWhere('msg.deletedByReceiver = false')
        .getCount();
      return { unreadCount: count };
    }

    const admin = await this.usersRepo.findOne({ where: { role: 'admin' } });
    if (!admin) return { unreadCount: 0 };

    const count = await this.chatRepo
      .createQueryBuilder('msg')
      .where('msg.receiverId = :me', { me: currentUser.id })
      .andWhere('msg.senderId = :adminId', { adminId: admin.id })
      .andWhere('msg.isRead = false')
      .andWhere('msg.deletedByReceiver = false')
      .getCount();

    return { unreadCount: count };
  }
}
