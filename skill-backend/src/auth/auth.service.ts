import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(body: any) {
    const { firstName, lastName, email, password, department, jobTitle } = body;
    if (!firstName || !lastName || !email || !password) throw new BadRequestException('First name, last name, email and password required');
    const exists = await this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
    if (exists) throw new BadRequestException('Email already exists');
    const hashed = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`;
    const user = this.usersRepo.create({ firstName, lastName, name, email: email.toLowerCase(), password: hashed, department, jobTitle });
    await this.usersRepo.save(user);
    return this.signToken(user);
  }

  async login(body: any) {
    const { email, password } = body;
    const user = await this.usersRepo.findOne({ where: { email: email?.toLowerCase() } });
    if (!user) throw new BadRequestException('Incorrect Email');
    if (!(await bcrypt.compare(password, user.password))) throw new BadRequestException('Incorrect Password');
    return this.signToken(user);
  }

  private getTransporter() {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return { message: 'If that email exists, an OTP has been sent.' };

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    user.resetToken = otp;
    user.resetTokenExpiry = Date.now() + 2 * 60 * 1000;
    await this.usersRepo.save(user);

    try {
      await this.getTransporter().sendMail({
        from: `"Kyyba Skill Tracker" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Your Password Reset OTP',
        html: `<p>Hello ${user.name},</p><p>Your OTP to reset your password is:</p><h2 style="letter-spacing:8px">${otp}</h2><p>This OTP is valid for <strong>2 minutes</strong>.</p>`,
      });
    } catch (err) {
      throw new BadRequestException('Failed to send OTP email. Please try again.');
    }

    return { message: 'OTP sent to your email.' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user || user.resetToken !== otp)
      throw new BadRequestException('Invalid OTP');
    if (!user.resetTokenExpiry || Number(user.resetTokenExpiry) < Date.now())
      throw new BadRequestException('OTP has expired');
    return { message: 'OTP verified' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user || user.resetToken !== otp)
      throw new BadRequestException('Invalid OTP');
    if (!user.resetTokenExpiry || Number(user.resetTokenExpiry) < Date.now())
      throw new BadRequestException('OTP has expired');

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await this.usersRepo.save(user);
    return { message: 'Password reset successful' };
  }

  async me(userId: string) {
    if (!this.isUuid(userId)) throw new UnauthorizedException('Invalid session, please log in again');
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Not found');
    const { password, ...rest } = user;
    return rest;
  }

  private isUuid(id: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  private signToken(user: User) {
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    return { token: this.jwtService.sign(payload), user: payload };
  }
}
