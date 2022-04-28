import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_SECRET")
        });
    }

    // Passport ensures that we receive a valid JWT
    // that we can safely decode
    async validate(payload: any) {
        return {
            id: payload.sub,
            username: payload.username,
            isTwoFactorAuthenticated: payload.isTwoFactorAuthenticated
        };
    }
}
