import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManageProjectHelpController } from './manage_project_help.controller';
import { ManageProjectHelpService } from './service/manage_project_help.service';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectIncoming])],
  controllers: [ManageProjectHelpController],
  providers: [ManageProjectHelpService],
})
export class ManageProjectHelpModule {}
