import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { authenticator } from "@otplib/preset-default";
import { UsersService } from "src/users/users.service";
import { toFileStream } from "qrcode";
import { Response } from "express";

@Injectable()
export class TwoFactorAuthService {
    constructor(
        private usersService: UsersService,
        private configService: ConfigService,
    ) {}

    codeIsValid(code: string, secret: string) {
        return authenticator.verify({ token: code, secret: secret });
    }

    validateCodeOrThrow(code: string, secret: string) {
        if (!this.codeIsValid(code, secret)) {
            throw new UnauthorizedException({
                code: "e2302",
                type: "Invalid 2FA code.",
                description: "Please provide a valid 2FA code."
            });
        }
    }

    async generateSecret(idUser: number) {
        const secret = authenticator.generateSecret();
        const user = await this.usersService.findOne(idUser);
        console.error("USER: ", user);
        const otpAuthUrl = authenticator.keyuri(
            user.name!,
            this.configService.get<string>("TWO_FACTOR_AUTH_APP_NAME")!,
            secret
        );
        await this.usersService.updateTwoFactorSecret(user.id!, secret);
        return { secret, otpAuthUrl };
    }

    async pipeQrCodeStream(stream: Response, otpAuthUrl: string) {
        return toFileStream(stream, otpAuthUrl);
    }
}
