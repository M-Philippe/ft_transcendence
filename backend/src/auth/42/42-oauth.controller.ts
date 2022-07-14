import { Controller, Get, HttpCode, Req, Res, UseGuards } from "@nestjs/common";
import e, { Response } from "express";
import { FRONT_42_FIRST_LOGIN_CHANGE_NAME, FRONT_42_LOGIN_FAILED, FRONT_LOGIN_SUCCESS, FRONT_QUERY_2FA_CODE } from "src/urlConstString";
import { UsersService } from "src/users/users.service";
import { JwtAuthService } from "../jwt/jwt-auth.service";
import { Oauth42Guard } from "./42-oauth.guard";

@Controller("auth/42")
export class OAuth42Controller {
    constructor(
      private jwtAuthService: JwtAuthService,
      private usersService: UsersService) {}

    @Get("login")
    @UseGuards(Oauth42Guard)
    @HttpCode(200)


    async auth42() {}

    @Get('redirect')
    @UseGuards(Oauth42Guard)
    async auth42Redirect(@Req() request: any, @Res() response: Response) {
      /*
        Create user if necessary
      */
      let userReturned = await this.usersService.createUser42({
        name: request.user.username,
        id42: request.user.id42,
        avatar: request.user.avatar,
      });
      if (userReturned === undefined) {
        response.redirect(FRONT_42_LOGIN_FAILED);
        return response;
      }
      // //console.error("STATE_LOGIN_42: ", userReturned);
      ////console.error(request.user.username, " has been attribute id: ", userReturned.user.id);
      let jwt = await this.jwtAuthService.getAccessToken(userReturned.user.id, userReturned.user.twoFactorIsEnabled);
      let p = await this.jwtAuthService.verify(jwt.access_token);
      ////console.error("which give in token id: ", p.idUser);

      if (request.headers["user-agent"] !== undefined &&
      (request.headers["user-agent"].indexOf("Chrome") !== -1 || request.headers["user-agent"].indexOf("Firefox") !== -1))
        response.cookie("authentication", jwt.access_token, { httpOnly: true, sameSite: "strict", secure: false });
      else if (request.headers["user-agent"] !== undefined && request.headers["user-agent"].indexOf("Safari") !== -1)
        response.cookie("authentication", jwt.access_token, { httpOnly: true, secure: true });
      else
        response.cookie("authentication", jwt.access_token, { httpOnly: true, sameSite: "none"});

      // //console.error("Aut42Redirect. reasponse:  ", response);
      if (userReturned.state === "exist" && !userReturned.user.twoFactorIsEnabled) {
        let queryString = "?id=" + userReturned.user.id + "&username=" + userReturned.user.name + "&avatar=" + userReturned.user.avatar;
        //console.error("user 42 already register, redirect to: ", FRONT_LOGIN_SUCCESS + queryString);
        response.redirect(FRONT_LOGIN_SUCCESS + queryString);
      } else if (userReturned.state === "exist" && userReturned.user.twoFactorIsEnabled) {
        response.redirect(FRONT_QUERY_2FA_CODE);
      } else {
        response.redirect(FRONT_42_FIRST_LOGIN_CHANGE_NAME + userReturned.user.name);
      }
      return response;
    }
}