import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './skill.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill) private skillsRepo: Repository<Skill>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async addSkill(userId: string, body: any) {
    const { name, proficiency, yearsUsed, monthsUsed } = body;
    if (!name || !proficiency) throw new BadRequestException('Skill name and proficiency required');
    const skill = this.skillsRepo.create({ name, proficiency, yearsUsed: yearsUsed || 0, monthsUsed: monthsUsed || 0, userId });
    await this.skillsRepo.save(skill);
    return this.getUser(userId);
  }

  async updateSkill(userId: string, skillId: string, body: any) {
    const skill = await this.skillsRepo.findOne({ where: { id: skillId, userId } });
    if (!skill) throw new NotFoundException('Skill not found');
    await this.skillsRepo.update(skillId, body);
    return this.getUser(userId);
  }

  async deleteSkill(userId: string, skillId: string) {
    await this.skillsRepo.delete({ id: skillId, userId });
    return this.getUser(userId);
  }

  private async getUser(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const { password, ...rest } = user;
    return rest;
  }
}
