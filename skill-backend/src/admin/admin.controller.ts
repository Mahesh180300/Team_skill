import { Controller, Get, Delete, Post, Patch, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { AdminGuard } from '../common/admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  getStats() {
    return this.adminService.getStats();
  }

  @Get('employees')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  getAllEmployees() {
    return this.adminService.getAllEmployees();
  }

  @Patch('employees/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  updateEmployee(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateEmployee(id, body);
  }

  @Delete('employees/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @HttpCode(204)
  deleteEmployee(@Param('id') id: string) {
    return this.adminService.deleteEmployee(id);
  }

  @Post('employees/:id/send-onboarding-email')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  sendOnboardingEmail(@Param('id') id: string, @Body() body: any) {
    return this.adminService.sendOnboardingEmail(id, body);
  }

  @Get('admins')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Post('admins')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  createAdmin(@Body() body: any) {
    return this.adminService.createAdmin(body);
  }

  @Post('seed-admin')
  seedAdmin() {
    return this.adminService.seedAdmin();
  }
}
