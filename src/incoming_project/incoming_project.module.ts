import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomingProjectService } from './service/incoming_project.service';
import { IncomingProjectController } from './incoming_project.controller';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { ProjectType } from '../database/entities/project_type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectIncoming, ProjectType])],
  controllers: [IncomingProjectController],
  providers: [IncomingProjectService],
})
export class IncomingProjectModule {}
