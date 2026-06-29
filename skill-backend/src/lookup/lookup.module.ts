import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupType } from './lookup-type.entity';
import { LookupValue } from './lookup-value.entity';
import { LookupService } from './lookup.service';
import { LookupController } from './lookup.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LookupType, LookupValue])],
  providers: [LookupService],
  controllers: [LookupController],
  exports: [LookupService],
})
export class LookupModule {}
