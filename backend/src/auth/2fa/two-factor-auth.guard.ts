import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class TwoFactorAuthGuard extends AuthGuard('2fa') {}