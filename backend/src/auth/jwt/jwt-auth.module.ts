import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt"
import { JwtAuthService } from "./jwt-auth.service";

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
              secret: configService.get<string>('JWT_SECRET'),
              signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') }
            }),
            inject: [ConfigService]
          })
    ],
    providers: [JwtAuthService],
    exports: [JwtAuthService]
})
export class JwtAuthModule {}