import { Controller, Get, Post, Delete, Patch, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../common/admin.guard';
import { LookupService } from './lookup.service';

@Controller('lookup')
export class LookupController {
  constructor(private lookupService: LookupService) {}

  // Public: get values by type name (used in register/edit forms)
  @Get('values')
  getValuesByType(@Query('type') type: string) {
    return this.lookupService.getValuesByType(type);
  }

  // Admin only
  @Get('types')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  getAllTypes() {
    return this.lookupService.getAllTypes();
  }

  @Post('types')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  createType(@Body('name') name: string) {
    return this.lookupService.createType(name);
  }

  @Delete('types/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  deleteType(@Param('id', ParseIntPipe) id: number) {
    return this.lookupService.deleteType(id);
  }

  @Post('types/:typeId/values')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  createValue(@Param('typeId', ParseIntPipe) typeId: number, @Body('value') value: string) {
    return this.lookupService.createValue(typeId, value);
  }

  @Patch('values/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  updateValue(@Param('id', ParseIntPipe) id: number, @Body('value') value: string) {
    return this.lookupService.updateValue(id, value);
  }

  @Delete('values/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  deleteValue(@Param('id', ParseIntPipe) id: number) {
    return this.lookupService.deleteValue(id);
  }
}
