import { forwardRef, Module } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { RelationshipsController } from './relationships.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Relationship } from './entities/relationship.entity';
import { JwtAuthModule } from 'src/auth/jwt/jwt-auth.module';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Relationship]), TypeOrmModule.forFeature([User]), JwtAuthModule, forwardRef(() => UsersModule)],
  controllers: [RelationshipsController],
  providers: [RelationshipsService],
  exports: [RelationshipsService]
})
export class RelationshipsModule {}
