import { Module } from '@nestjs/common';
import { IncomingProjectService } from './incoming_project.service';
import { IncomingProjectController } from './incoming_project.controller';

@Module({
  controllers: [IncomingProjectController],
  providers: [IncomingProjectService],
})
export class IncomingProjectModule {}
