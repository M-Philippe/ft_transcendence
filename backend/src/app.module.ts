import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { RelationshipsModule } from './relationships/relationships.module';
import { MatchesModule } from './matches/matches.module';
import { LifecycleService } from './lifecycle/lifecycle.service';
import { MatchesOnGoingModule } from './matchesOngoing/matchesOnGoing.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'host.docker.internal',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'database',
      autoLoadEntities: true,
      synchronize: true,
      verboseRetryLog: true
  }),
    UsersModule,
    RelationshipsModule,
    MatchesModule,
    MatchesOnGoingModule,
    ChatModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, LifecycleService],
})
export class AppModule {}
