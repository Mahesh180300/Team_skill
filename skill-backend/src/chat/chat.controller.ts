import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('contacts')
  getContacts(@CurrentUser() user: any) {
    return this.chatService.getContacts(user);
  }

  @Get('messages/:otherUserId')
  getMessages(@CurrentUser() user: any, @Param('otherUserId') otherUserId: string) {
    return this.chatService.getMessages(user, otherUserId);
  }

  @Post('messages')
  sendMessage(@CurrentUser() user: any, @Body() body: { receiverId: string; content: string }) {
    return this.chatService.sendMessage(user, body.receiverId, body.content);
  }

  @Patch('read/:otherUserId')
  markAsRead(@CurrentUser() user: any, @Param('otherUserId') otherUserId: string) {
    return this.chatService.markAsRead(user, otherUserId);
  }

  @Patch('messages/:messageId')
  updateMessage(@CurrentUser() user: any, @Param('messageId') messageId: string, @Body() body: { content: string }) {
    return this.chatService.updateMessage(user, messageId, body.content);
  }

  @Delete('messages/:messageId')
  deleteMessage(@CurrentUser() user: any, @Param('messageId') messageId: string) {
    return this.chatService.deleteMessage(user, messageId);
  }

  @Get('unread')
  getUnread(@CurrentUser() user: any) {
    return this.chatService.getUnreadCount(user);
  }
}
