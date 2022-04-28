import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "src/users/users.service";

@Injectable()
export class TwoFactorAuthStrategy extends PassportStrategy(Strategy, '2fa') {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')
        });
    }

    async validate(payload: any) {
        const user = await this.usersService.findOne(payload.sub);
        if (!user.twoFactorIsEnabled || payload.isTwoFactorAuthenticated) {
            return user;
        }
    }
}