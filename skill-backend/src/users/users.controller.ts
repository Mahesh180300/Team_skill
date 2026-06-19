import { Controller, Get, Put, Post, Delete, Body, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/current-user.decorator';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Post('profile/resume')
  @UseInterceptors(FileInterceptor('resume', {
    fileFilter: (req, file, cb) => {
      const allowed = ['.pdf', '.doc', '.docx'];
      cb(null, allowed.includes(extname(file.originalname).toLowerCase()));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadResume(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) return { error: 'Invalid file. Only PDF, DOC, DOCX allowed.' };
    return this.usersService.uploadResume(user.id, file);
  }

  @Delete('profile/resume')
  deleteResume(@CurrentUser() user: any) {
    return this.usersService.deleteResume(user.id);
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateAvatar(user.id, file);
  }

  @Delete('profile/avatar')
  deleteAvatar(@CurrentUser() user: any) {
    return this.usersService.deleteAvatar(user.id);
  }


  @Get('employees')
  searchEmployees(@Query() query: any) {
    return this.usersService.searchEmployees(query);
  }
}
