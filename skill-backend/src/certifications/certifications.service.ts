import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certification } from './certification.entity';
import { User } from '../users/user.entity';

@Injectable()
export class CertificationsService {
  constructor(
    @InjectRepository(Certification) private certsRepo: Repository<Certification>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async addCertification(userId: string, body: any, file?: Express.Multer.File) {
    const { name, issuer, year } = body;
    if (!name) throw new BadRequestException('Certification name required');
    const cert = this.certsRepo.create({
      name,
      issuer,
      year: year ? Number(year) : null,
      userId,
      ...(file && {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileData: file.buffer.toString('base64'),
      }),
    });
    await this.certsRepo.save(cert);
    return this.getUser(userId);
  }

  async editCertification(userId: string, certId: string, body: any, file?: Express.Multer.File) {
    const cert = await this.certsRepo.findOne({ where: { id: certId, userId } });
    if (!cert) throw new BadRequestException('Certification not found');
    const { name, issuer, year } = body;
    if (name) cert.name = name;
    if (issuer !== undefined) cert.issuer = issuer;
    if (year !== undefined) cert.year = year ? Number(year) : null;
    if (file) {
      cert.fileName = file.originalname;
      cert.fileType = file.mimetype;
      cert.fileData = file.buffer.toString('base64');
    }
    await this.certsRepo.save(cert);
    return this.getUser(userId);
  }

  async deleteCertification(userId: string, certId: string) {
    await this.certsRepo.delete({ id: certId, userId });
    return this.getUser(userId);
  }

  private async getUser(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const { password, ...rest } = user;
    return rest;
  }
}
