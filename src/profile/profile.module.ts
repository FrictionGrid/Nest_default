import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { ProfileController } from './profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [ProfileController],
})
export class ProfileModule {}
