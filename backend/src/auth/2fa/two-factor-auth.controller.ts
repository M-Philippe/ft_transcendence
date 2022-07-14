import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { JwtGuard, JwtGuardWaiting2faCode } from "src/guards/jwt.guards";
import { FRONT_DISCONNECTING, FRONT_LOGIN_SUCCESS } from "src/urlConstString";
import { UsersService } from "src/users/users.service";
import { JwtAuthService } from "../jwt/jwt-auth.service";
import { TwoFactorAuthCodeDto } from "./dto/two-factor-code.dto";
import { TwoFactorAuthService } from "./two-factor-auth.service";

// FLOW:
// get qr from /setup endpoint and scan it in application
// enter applications code and call /enable endpoint to definitively enable 2fa

@Controller("auth/2fa")
export class TwoFactorAuthController {
    constructor(
        private twoFactorAuthService: TwoFactorAuthService,
        private jwtAuthService :JwtAuthService,
        private usersService: UsersService
    ) {}

    @Get("/setup")
    @UseGuards(JwtGuard)
    async setup2fa(@Req() req: Request, @Res() res: any) {
      let idUser = this.jwtAuthService.verify(req.cookies.authentication).idUser;
      const { otpAuthUrl } = await this.twoFactorAuthService.generateSecret(idUser);
      res.send(otpAuthUrl);
      return (otpAuthUrl);
    }

    @Post("/enable")
    @UseGuards(JwtGuard)
    async enable2fa(@Req() req: Request, @Body() {twoFactorCode}: TwoFactorAuthCodeDto, @Res() response: Response) {
      let idUser = this.jwtAuthService.verify(req.cookies.authentication).idUser;
      const user = await this.usersService.findOne(idUser);
      this.twoFactorAuthService.validateCodeOrThrow(twoFactorCode!, user.twoFactorSecret || "");
      await this.usersService.updateTwoFactorEnabled(idUser, true);
      // new JwtToken with secret.
      let newJwtToken = await this.jwtAuthService.getAccessTokenTwoFactor(idUser, true!);

      if (req.headers["user-agent"] !== undefined &&
      (req.headers["user-agent"].indexOf("Chrome") !== -1 || req.headers["user-agent"].indexOf("Firefox") !== -1))
        response.cookie("authentication", newJwtToken.access_token, { httpOnly: true, sameSite: "strict", secure: false });
      else if (req.headers["user-agent"] !== undefined && req.headers["user-agent"].indexOf("Safari") !== -1)
        response.cookie("authentication", newJwtToken.access_token, { httpOnly: true, sameSite: "none", secure: false });
      else
        response.cookie("authentication", newJwtToken.access_token, { httpOnly: true, sameSite: "none"});


      let queryString = "?id=" + user.id + "&username=" + user.name + "&avatar=" + user.avatar;
      response.status(302);
      //console.log("NEW_TOKEN: ", newJwtToken.access_token);
      response.send(JSON.stringify({ location: FRONT_LOGIN_SUCCESS + queryString }));
      return (response);
    }

    @Post("/authenticate")
    @UseGuards(JwtGuardWaiting2faCode)
    async authenticate(@Req() req: Request, @Body() { twoFactorCode }: TwoFactorAuthCodeDto, @Res() response: Response) {
      let idUser = this.jwtAuthService.verify(req.cookies.authentication).idUser;
      const user = await this.usersService.findOne(idUser);
      try {
        this.twoFactorAuthService.validateCodeOrThrow(twoFactorCode!, user.twoFactorSecret || "");
      } catch (error) {
        response.cookie("authentication", "", { httpOnly: true, sameSite: "strict"});
        response.status(302);
        response.send(JSON.stringify({ location: FRONT_DISCONNECTING }));
        return (response);
      }
      response.status(302);

      let jwt = await this.jwtAuthService.getAccessTokenTwoFactor(idUser, true);
      if (req.headers["user-agent"] !== undefined &&
      (req.headers["user-agent"].indexOf("Chrome") !== -1 || req.headers["user-agent"].indexOf("Firefox") !== -1))
        response.cookie("authentication", jwt.access_token, { httpOnly: true, sameSite: "strict", secure: false });
      else if (req.headers["user-agent"] !== undefined && req.headers["user-agent"].indexOf("Safari") !== -1)
        response.cookie("authentication", jwt.access_token, { httpOnly: true, sameSite: "none", secure: false });
      else
        response.cookie("authentication", jwt.access_token, { httpOnly: true, sameSite: "none"});

      let queryString = "?id=" + user.id + "&username=" + user.name + "&avatar=" + user.avatar;
      response.send(JSON.stringify({ location: FRONT_LOGIN_SUCCESS + queryString }));
      return (response);
    }

    @Post("/disable")
    @UseGuards(JwtGuard)
    async disable2fa(@Req() req: Request) {
      let idUser = this.jwtAuthService.verify(req.cookies.authentication).idUser;
      await this.usersService.updateTwoFactorEnabled(idUser, false);
    }
}
