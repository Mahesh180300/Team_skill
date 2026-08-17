import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationsService } from './certifications.service';
import { CertificationsController } from './certifications.controller';
import { Certification } from './certification.entity';
import { User } from '../users/user.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Certification, User]), CloudinaryModule],
  providers: [CertificationsService],
  controllers: [CertificationsController],
})
export class CertificationsModule {}
