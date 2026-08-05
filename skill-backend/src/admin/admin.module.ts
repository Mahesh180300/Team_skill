import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/user.entity';
import { Certification } from '../certifications/certification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Certification])],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
