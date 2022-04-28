import { Module } from '@nestjs/common';
import { OAuth42Strategy } from './42/42-oauth.strategy';
import { OAuth42Controller } from './42/42-oauth.controller';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { JwtAuthModule } from './jwt/jwt-auth.module';
import { JwtStrategy } from './jwt/jwt-auth.strategy';
import { TwoFactorAuthController } from './2fa/two-factor-auth.controller';
import { TwoFactorAuthService } from './2fa/two-factor-auth.service';
import { LocalController } from './local/local.controller';

@Module({
  imports: [UsersModule, ConfigModule, JwtAuthModule],
  controllers: [OAuth42Controller, TwoFactorAuthController, LocalController],
  providers: [
    OAuth42Strategy, JwtStrategy, TwoFactorAuthService],
  exports: [JwtAuthModule]
})
export class AuthModule {}
