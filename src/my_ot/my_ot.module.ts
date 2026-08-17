import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyOtController } from './my_ot.controller';
import { MyOtService } from './my_ot.service';
import { OvertimeRequest } from '../database/entities/overtime_request.entity';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OvertimeRequest, ProjectIncoming])],
  controllers: [MyOtController],
  providers: [MyOtService],
})
export class MyOtModule {}
