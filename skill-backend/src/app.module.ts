import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SkillsModule } from './skills/skills.module';
import { CertificationsModule } from './certifications/certifications.module';
import { AdminModule } from './admin/admin.module';
import { LookupModule } from './lookup/lookup.module';
import { User } from './users/user.entity';
import { Skill } from './skills/skill.entity';
import { Certification } from './certifications/certification.entity';
import { LookupType } from './lookup/lookup-type.entity';
import { LookupValue } from './lookup/lookup-value.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [User, Skill, Certification, LookupType, LookupValue],
        synchronize: true,
        // ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    AuthModule,
    UsersModule,
    SkillsModule,
    CertificationsModule,
    AdminModule,
    LookupModule,
  ],
})
export class AppModule {}
