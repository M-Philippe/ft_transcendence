import { IsNotEmpty, IsNumberString } from "class-validator";

export class TwoFactorAuthCodeDto {
    @IsNotEmpty()
    @IsNumberString()
    twoFactorCode: string;
}
