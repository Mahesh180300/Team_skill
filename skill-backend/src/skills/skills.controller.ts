import { Controller, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkillsService } from './skills.service';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('profile/skills')
@UseGuards(AuthGuard('jwt'))
export class SkillsController {
  constructor(private skillsService: SkillsService) {}

  @Post()
  addSkill(@CurrentUser() user: any, @Body() body: any) {
    return this.skillsService.addSkill(user.id, body);
  }

  @Post('bulk')
  bulkAddSkills(@CurrentUser() user: any, @Body() body: { skills: any[] }) {
    return this.skillsService.bulkAddSkills(user.id, body.skills);
  }

  @Put(':skillId')
  updateSkill(@CurrentUser() user: any, @Param('skillId') skillId: string, @Body() body: any) {
    return this.skillsService.updateSkill(user.id, skillId, body);
  }

  @Delete(':skillId')
  deleteSkill(@CurrentUser() user: any, @Param('skillId') skillId: string) {
    return this.skillsService.deleteSkill(user.id, skillId);
  }
}
