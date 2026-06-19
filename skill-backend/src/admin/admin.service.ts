import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

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

    return { totalEmployees, topSkills, departmentDistribution, skillGapCount };
  }

  async getAllEmployees() {
    const employees = await this.usersRepo.find({
      where: { role: 'employee' },
      order: { createdAt: 'DESC' },
    });
    return employees.map(({ password, ...rest }) => rest);
  }

  async deleteEmployee(id: string) {
    await this.usersRepo.delete(id);
  }

  async seedAdmin() {
    const exists = await this.usersRepo.findOne({ where: { role: 'admin' } });
    if (exists) return { message: 'Admin already exists' };
    const hashed = await bcrypt.hash('admin123', 10);
    await this.usersRepo.save(
      this.usersRepo.create({ name: 'Admin', email: 'admin@kyyba.com', password: hashed, role: 'admin' }),
    );
    return { message: 'Admin created' };
  }
}
