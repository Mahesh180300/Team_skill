import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const RESUME_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private cloudinary: CloudinaryService,
  ) {}

  async getProfile(userId: string) {
    if (!isUuid(userId)) throw new UnauthorizedException('Invalid session, please log in again');
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    const { password, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, body: any) {
    const { firstName, lastName, department, jobTitle, currentProject, dateOfJoining, dateOfProjectAssigning, billable, manager } = body;
    const name = firstName && lastName ? `${firstName} ${lastName}` : undefined;
    const updates: any = { department, jobTitle, currentProject, dateOfJoining: dateOfJoining || null, dateOfProjectAssigning: dateOfProjectAssigning || null, billable, manager };
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (name) updates.name = name;
    await this.repo.update(userId, updates);
    return this.getProfile(userId);
  }

  async uploadResume(userId: string, file: Express.Multer.File) {
    const user = await this.repo.findOne({ where: { id: userId } });
    // Delete old Cloudinary file if exists
    if (user?.resumePublicId) {
      await this.cloudinary.delete(user.resumePublicId);
    }
    const result = await this.cloudinary.upload(file, 'resumes', RESUME_MIMES);
    await this.repo.update(userId, {
      resumeUrl: result.secure_url,
      resumePublicId: result.public_id,
      resumeFileName: file.originalname,
      resumeFileType: file.mimetype,
      resumeData: '',
    });
    return this.getProfile(userId);
  }

  async deleteResume(userId: string) {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (user?.resumePublicId) {
      await this.cloudinary.delete(user.resumePublicId);
    }
    await this.repo.update(userId, {
      resumeData: '',
      resumeFileName: '',
      resumeFileType: '',
      resumeUrl: null,
      resumePublicId: null,
    });
    return { success: true };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    if (!file) throw new Error('No file provided');
    const user = await this.repo.findOne({ where: { id: userId } });
    // Delete old avatar from Cloudinary if it was uploaded there
    if (user?.avatarPublicId) {
      await this.cloudinary.delete(user.avatarPublicId);
    }
    const result = await this.cloudinary.upload(file, 'avatars', AVATAR_MIMES);
    await this.repo.update(userId, {
      avatar: result.secure_url,
      avatarPublicId: result.public_id,
    });
    return this.getProfile(userId);
  }

  async deleteAvatar(userId: string) {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (user?.avatarPublicId) {
      await this.cloudinary.delete(user.avatarPublicId);
    }
    await this.repo.update(userId, { avatar: null, avatarPublicId: null });
    return this.getProfile(userId);
  }

  async updateLastSeen(userId: string) {
    await this.repo.update(userId, { lastSeen: new Date() });
    return { success: true };
  }

  async searchEmployees(query: any) {
    const { skill, department, minExp, certification } = query;
    const qb = this.repo.createQueryBuilder('user')
      .leftJoinAndSelect('user.skills', 'skill')
      .leftJoinAndSelect('user.certifications', 'cert')
      .where('user.role = :role', { role: 'employee' });

    if (skill) qb.andWhere('skill.name ILIKE :skill', { skill: `%${skill}%` });
    if (department) qb.andWhere('user.department ILIKE :dept', { dept: `%${department}%` });
    if (minExp) qb.andWhere('user.dateOfJoining <= :maxDate', { maxDate: new Date(new Date().setFullYear(new Date().getFullYear() - Number(minExp))).toISOString().split('T')[0] });
    if (certification) qb.andWhere('cert.name ILIKE :cert', { cert: `%${certification}%` });

    const users = await qb.getMany();
    return users.map(({ password, ...rest }) => rest);
  }
}
