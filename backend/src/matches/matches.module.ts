import { forwardRef, Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { UsersModule } from 'src/users/users.module';
import { JwtAuthModule } from 'src/auth/jwt/jwt-auth.module';

@Module({
  imports: [forwardRef(() => UsersModule), TypeOrmModule.forFeature([Match]), JwtAuthModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService]
})
export class MatchesModule {}
