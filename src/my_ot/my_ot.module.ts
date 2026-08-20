import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyOtController } from './my_ot.controller';
import { MyOtService } from './my_ot.service';
import { OvertimeRequest } from '../database/entities/overtime_request.entity';
import { ProjectMain } from '../database/entities/project_main.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OvertimeRequest, ProjectMain])],
  controllers: [MyOtController],
  providers: [MyOtService],
})
export class MyOtModule {}
