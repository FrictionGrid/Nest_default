import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { EmployeeProfile } from '../database/entities/employee_profile.entity';
import { ProfileController } from './profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, EmployeeProfile])],
  controllers: [ProfileController],
})
export class ProfileModule {}
