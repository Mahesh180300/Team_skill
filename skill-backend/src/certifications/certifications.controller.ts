import { Controller, Post, Patch, Delete, Param, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { CertificationsService } from './certifications.service';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('profile/certifications')
@UseGuards(AuthGuard('jwt'))
export class CertificationsController {
  constructor(private certsService: CertificationsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  addCertification(@CurrentUser() user: any, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.certsService.addCertification(user.id, req.body, file);
  }

  @Patch(':certId')
  @UseInterceptors(FileInterceptor('file'))
  editCertification(@CurrentUser() user: any, @Param('certId') certId: string, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.certsService.editCertification(user.id, certId, req.body, file);
  }

  @Delete(':certId')
  deleteCertification(@CurrentUser() user: any, @Param('certId') certId: string) {
    return this.certsService.deleteCertification(user.id, certId);
  }
}
