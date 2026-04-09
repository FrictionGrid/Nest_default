import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomingProjectModule } from './incoming_project/incoming_project.module';
import { ProjectIncoming } from './database/entities/project_incoming.entity';
import { ProjectType } from './database/entities/project_type.entity';
import { Team } from './database/entities/team.entity';
import { ProjectTeam } from './database/entities/project_team.entity';
import { ManageProjectModule } from './manage_project/manage_project.module';
import { ManageTeamModule } from './manage_team/manage_team.module';
import { User } from './database/entities/user.entity';
import { UsersTeam } from './database/entities/users_team.entity';
import { TaskTeam } from './database/entities/task_team.entity';
import { OverviewProjectModule } from './overview_project/overview_project.module';
import { DetailProjectModule } from './detail_project/detail_project.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [ProjectIncoming, ProjectType, Team, ProjectTeam, User, UsersTeam, TaskTeam],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    IncomingProjectModule,
    ManageProjectModule,
    ManageTeamModule,
    OverviewProjectModule,
    DetailProjectModule,
  ],
})
export class AppModule {}
