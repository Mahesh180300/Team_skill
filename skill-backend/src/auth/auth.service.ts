import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(body: any) {
    const { name, email, password, department, jobTitle, yearsOfExperience } = body;
    if (!name || !email || !password) throw new BadRequestException('Name, email and password required');
    const exists = await this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
    if (exists) throw new BadRequestException('Email already exists');
    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({ name, email: email.toLowerCase(), password: hashed, department, jobTitle, yearsOfExperience });
    await this.usersRepo.save(user);
    return this.signToken(user);
  }

  async login(body: any) {
    const { email, password } = body;
    const user = await this.usersRepo.findOne({ where: { email: email?.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password))) throw new UnauthorizedException('Invalid credentials');
    return this.signToken(user);
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
