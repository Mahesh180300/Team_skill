import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Certification } from '../certifications/certification.entity';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Certification) private certRepo: Repository<Certification>,
  ) {}

  async getStats() {
    const totalEmployees = await this.usersRepo.count({ where: { role: 'employee' } });

    const topSkills = await this.usersRepo
      .createQueryBuilder('user')
      .innerJoin('user.skills', 'skill')
      .select('skill.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('user.role = :role', { role: 'employee' })
      .groupBy('skill.name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const departmentDistribution = await this.usersRepo
      .createQueryBuilder('user')
      .select('user.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .where('user.role = :role AND user.department != :empty', { role: 'employee', empty: '' })
      .groupBy('user.department')
      .orderBy('count', 'DESC')
      .getRawMany();

    const skillGapRows = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoin('user.skills', 'skill')
      .select('user.id', 'userId')
      .where('user.role = :role', { role: 'employee' })
      .groupBy('user.id')
      .having('COUNT(skill.id) = 0')
      .getRawMany();
    const skillGapCount = skillGapRows.length;

    const today = new Date();
    const soonDate = new Date();
    soonDate.setDate(today.getDate() + 30);
    const todayStr = today.toISOString().split('T')[0];
    const soonStr = soonDate.toISOString().split('T')[0];

    const allCerts = await this.certRepo.find({ select: ['id', 'expiryDate'] });
    const certStatus = { active: 0, expiringSoon: 0, expired: 0 };
    for (const cert of allCerts) {
      if (!cert.expiryDate) { certStatus.active++; }
      else if (cert.expiryDate < todayStr) { certStatus.expired++; }
      else if (cert.expiryDate <= soonStr) { certStatus.expiringSoon++; }
      else { certStatus.active++; }
    }

    const recentJoiners = await this.usersRepo.find({
      where: { role: 'employee' },
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'name', 'firstName', 'department', 'dateOfJoining', 'avatar', 'createdAt'],
    });

    return { totalEmployees, topSkills, departmentDistribution, skillGapCount, certStatus, recentJoiners };
  }

  async getAllEmployees() {
    const employees = await this.usersRepo.find({
      where: { role: 'employee' },
      order: { createdAt: 'DESC' },
    });
    return employees.map(({ password, ...rest }) => rest);
  }

  async updateEmployee(id: string, body: any) {
    const { firstName, lastName, department, jobTitle, currentProject, dateOfJoining, dateOfProjectAssigning, billable, manager } = body;
    const updates: any = { department, jobTitle, currentProject, dateOfJoining: dateOfJoining || null, dateOfProjectAssigning: dateOfProjectAssigning || null, billable, manager };
    if (firstName) { updates.firstName = firstName; }
    if (lastName) { updates.lastName = lastName; }
    if (firstName && lastName) updates.name = `${firstName} ${lastName}`;
    await this.usersRepo.update(id, updates);
    const user = await this.usersRepo.findOne({ where: { id } });
    const { password, ...rest } = user;
    return rest;
  }

  async deleteEmployee(id: string) {
    await this.usersRepo.delete(id);
  }

  async sendOnboardingEmail(id: string, body: { subject: string; projectName: string; message: string }) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Employee not found');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });

    try {
      await transporter.sendMail({
        from: `"Kyyba Skill Tracker" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: body.subject,
        html: `
          <p>Hi ${user.name},</p>
          <p>${body.message.replace(/\n/g, '<br/>')}</p>
          <p><strong>Project:</strong> ${body.projectName}</p>
          <br/>
          <p>Best regards,<br/>Kyyba Admin Team</p>
        `,
      });
    } catch (err) {
      throw new Error(`Failed to send email: ${err instanceof Error ? err.message : String(err)}`);
    }

    return { message: 'Onboarding email sent successfully.' };
  }

  async seedAdmin() {
    const hashed = await bcrypt.hash('admin123', 10);
    const defaultAdmins = [
      { firstName: 'Sajith', lastName: 'Kumar Sivanandan', name: 'Sajith Kumar Sivanandan', email: 'sajiths@kyyba.com', password: hashed },
      { firstName: 'Sai', lastName: 'Admin', name: 'Sai Admin', email: 'sai@kyyba.com', password: hashed },
    ];

    for (const admin of defaultAdmins) {
      const existing = await this.usersRepo.findOne({ where: { email: admin.email.toLowerCase() } });
      if (existing) {
        await this.usersRepo.update(existing.id, { firstName: admin.firstName, lastName: admin.lastName, name: admin.name, password: admin.password, role: 'admin' });
      } else {
        await this.usersRepo.save(
          this.usersRepo.create({ firstName: admin.firstName, lastName: admin.lastName, name: admin.name, email: admin.email.toLowerCase(), password: admin.password, jobTitle: 'Administrator', role: 'admin' }),
        );
      }
    }
    return { message: 'Admins seeded' };
  }

  async createAdmin(body: { firstName: string; lastName: string; email: string; password: string; jobTitle?: string }) {
    const { firstName, lastName, email, password, jobTitle } = body;
    if (!firstName || !lastName || !email || !password) {
      throw new Error('First name, last name, email and password are required');
    }
    const exists = await this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
    if (exists) throw new Error('Email already exists');
    const hashed = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`;
    const user = this.usersRepo.create({
      firstName,
      lastName,
      name,
      email: email.toLowerCase(),
      password: hashed,
      jobTitle: jobTitle || 'Administrator',
      role: 'admin',
    });
    await this.usersRepo.save(user);
    const { password: _pw, ...rest } = user;
    return rest;
  }

  async getAllAdmins() {
    const admins = await this.usersRepo.find({ where: { role: 'admin' }, order: { createdAt: 'DESC' } });
    return admins.map(({ password, ...rest }) => rest);
  }
}
