import { Module } from '@nestjs/common';
import { ActivityLogController } from './activity_log.controller';

@Module({ controllers: [ActivityLogController] })
export class ActivityLogModule {}
