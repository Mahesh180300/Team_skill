import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certification } from './certification.entity';
import { User } from '../users/user.entity';
import { CERTIFICATION_OPTIONS } from '../common/constants/certification-options.constant';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const CERT_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];

@Injectable()
export class CertificationsService {
  constructor(
    @InjectRepository(Certification) private certsRepo: Repository<Certification>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private cloudinary: CloudinaryService,
  ) {}

  getCertificationOptions() {
    return { options: CERTIFICATION_OPTIONS };
  }

  async addCertification(userId: string, body: any, file?: Express.Multer.File) {
    const { name, issuer, year, issuedOn, expiryDate } = body;
    if (!name) throw new BadRequestException('Certification name required');

    let fileFields: Partial<Certification> = {};
    if (file) {
      const result = await this.cloudinary.upload(file, 'certifications', CERT_MIMES);
      fileFields = {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileUrl: result.secure_url,
        filePublicId: result.public_id,
        fileData: '',
      };
    }

    const cert = this.certsRepo.create({
      name,
      issuer,
      year: year ? Number(year) : null,
      issuedOn: issuedOn || null,
      expiryDate: expiryDate || null,
      userId,
      ...fileFields,
    });
    await this.certsRepo.save(cert);
    return this.getUser(userId);
  }

  async editCertification(userId: string, certId: string, body: any, file?: Express.Multer.File) {
    const cert = await this.certsRepo.findOne({ where: { id: certId, userId } });
    if (!cert) throw new BadRequestException('Certification not found');

    const { name, issuer, year, issuedOn, expiryDate } = body;
    if (name) cert.name = name;
    if (issuer !== undefined) cert.issuer = issuer;
    if (year !== undefined) cert.year = year ? Number(year) : null;
    if (issuedOn !== undefined) cert.issuedOn = issuedOn || null;
    if (expiryDate !== undefined) cert.expiryDate = expiryDate || null;

    if (file) {
      // Delete old file from Cloudinary
      if (cert.filePublicId) {
        await this.cloudinary.delete(cert.filePublicId);
      }
      const result = await this.cloudinary.upload(file, 'certifications', CERT_MIMES);
      cert.fileName = file.originalname;
      cert.fileType = file.mimetype;
      cert.fileUrl = result.secure_url;
      cert.filePublicId = result.public_id;
      cert.fileData = '';
    }

    await this.certsRepo.save(cert);
    return this.getUser(userId);
  }

  async deleteCertification(userId: string, certId: string) {
    const cert = await this.certsRepo.findOne({ where: { id: certId, userId } });
    if (cert?.filePublicId) {
      await this.cloudinary.delete(cert.filePublicId);
    }
    await this.certsRepo.delete({ id: certId, userId });
    return this.getUser(userId);
  }

  async getCertStats(userId: string) {
    const certs = await this.certsRepo.find({ where: { userId } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30 = new Date(today);
    in30.setDate(today.getDate() + 30);

    let activeCertifications = 0;
    let expiringSoon = 0;
    let expiredCertifications = 0;

    for (const cert of certs) {
      if (!cert.expiryDate) { activeCertifications++; continue; }
      const expiry = new Date(cert.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      if (expiry < today) {
        expiredCertifications++;
      } else if (expiry <= in30) {
        expiringSoon++;
        activeCertifications++;
      } else {
        activeCertifications++;
      }
    }

    return {
      totalCertifications: certs.length,
      activeCertifications,
      expiringSoon,
      expiredCertifications,
    };
  }

  private async getUser(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const { password, ...rest } = user;
    return rest;
  }
}
