import { Module } from '@nestjs/common';
import { DetailProjectService } from './detail_project.service';
import { DetailProjectController } from './detail_project.controller';

@Module({
  controllers: [DetailProjectController],
  providers: [DetailProjectService],
})
export class DetailProjectModule {}
