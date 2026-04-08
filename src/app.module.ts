import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IncomingProjectModule } from './incoming_project/incoming_project.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    IncomingProjectModule,
  ],
})
export class AppModule {}
