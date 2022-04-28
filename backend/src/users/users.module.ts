import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Relationship } from 'src/relationships/entities/relationship.entity';
import { JwtAuthModule } from 'src/auth/jwt/jwt-auth.module';
import { UsersGateway } from './users.gateway';
import { RelationshipsModule } from 'src/relationships/relationships.module';
import { MatchesOnGoingModule } from 'src/matchesOngoing/matchesOnGoing.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Relationship]),  JwtAuthModule, forwardRef(() => RelationshipsModule), forwardRef(() => MatchesOnGoingModule)],
  controllers: [UsersController],
  providers: [UsersService, UsersGateway],
  exports: [UsersService],
})
export class UsersModule {}
