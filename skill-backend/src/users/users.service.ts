import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as fs from 'fs';
import * as path from 'path';

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async getProfile(userId: string) {
    if (!isUuid(userId)) throw new UnauthorizedException('Invalid session, please log in again');
    const user = await this.repo.findOne({ where: { id: userId } });
    const { password, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, body: any) {
    const { name, department, jobTitle, yearsOfExperience } = body;
    await this.repo.update(userId, { name, department, jobTitle, yearsOfExperience });
    return this.getProfile(userId);
  }

  async uploadResume(userId: string, file: Express.Multer.File) {
    const resumeUrl = `/uploads/${file.filename}`;
    const resumeOriginalName = file.originalname;
    await this.repo.update(userId, { resumeUrl, resumeOriginalName });
    return this.getProfile(userId);
  }

  async deleteResume(userId: string) {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (user?.resumeUrl) {
      const filePath = path.join(process.cwd(), 'uploads', path.basename(user.resumeUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await this.repo.update(userId, { resumeUrl: '', resumeOriginalName: '' });
    return { success: true };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    if (!file) throw new Error('No file provided');
    const avatar = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    await this.repo.update(userId, { avatar });
    return this.getProfile(userId);
  }

  async deleteAvatar(userId: string) {
    await this.repo.update(userId, { avatar: null });
    return this.getProfile(userId);
  }

  async searchEmployees(query: any) {
    const { skill, department, minExp, certification } = query;
    const qb = this.repo.createQueryBuilder('user')
      .leftJoinAndSelect('user.skills', 'skill')
      .leftJoinAndSelect('user.certifications', 'cert')
      .where('user.role = :role', { role: 'employee' });

    if (skill) qb.andWhere('skill.name ILIKE :skill', { skill: `%${skill}%` });
    if (department) qb.andWhere('user.department ILIKE :dept', { dept: `%${department}%` });
    if (minExp) qb.andWhere('user.yearsOfExperience >= :minExp', { minExp: Number(minExp) });
    if (certification) qb.andWhere('cert.name ILIKE :cert', { cert: `%${certification}%` });

    const users = await qb.getMany();
    return users.map(({ password, ...rest }) => rest);
  }
}
