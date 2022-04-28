import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthService {
    constructor(private jwtService: JwtService) {}

    async getAccessToken(idUser: number, userIsTwoFactorAuthenticated: boolean) {
        return {
            access_token: this.jwtService.sign({
                idUser: idUser,
                isTwoFactorAuthenticated: userIsTwoFactorAuthenticated,
                hasProvidedTwoFactorCode: false,
                dateEmitted: Date.now(),
            })
        };
    }

    async getAccessTokenTwoFactor(idUser: number, hasProvidedTwoFactorCode: boolean) {
        return {
            access_token: this.jwtService.sign({
                idUser: idUser,
                isTwoFactorAuthenticated: true,
                hasProvidedTwoFactorCode: true,
                dateEmitted: Date.now(),
            })
        };
    }

    decode(jwt: string) {
        return (this.jwtService.decode(jwt));
    }

    verify(jwt: string) {
        return (this.jwtService.verify(jwt));
    }
}
