import { Controller, Get, HttpCode, Req, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
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
      console.error("\t\tUser: ", request.user);
      /*
        Create user if necessary
      */
      let userReturned = await this.usersService.createUser42({
        name: request.user.username,
        id42: request.user.id42,
        avatar: request.user.avatar,
      });
      if (userReturned === undefined) {
        response.redirect("http://localhost:3005/loginFailed");
        return response;
      }
      let jwt = await this.jwtAuthService.getAccessToken(userReturned.user.id, userReturned.user.twoFactorIsEnabled);
      response.cookie("authentication", jwt.access_token);
      console.error("JWT_REDIRECT: ", jwt);
      if (userReturned.state === "exist" && !userReturned.user.twoFactorIsEnabled) {
        let queryString = "?id=" + userReturned.user.id + "&username=" + userReturned.user.name + "&avatar=" + userReturned.user.avatar;
        response.redirect("http://localhost:3005/loginSuccess" + queryString);
      } else if (userReturned.state === "exist" && userReturned.user.twoFactorIsEnabled) {
        response.redirect("http://localhost:3005/query2faCode");
      } else {
        response.redirect("http://localhost:3005/firstLogin?generatedUsername=" + userReturned.user.name);
      }
      console.error("auth42_REDIRECT");
      return response;
    }
}

/*
VALIDATE:  cdbbc71fc1d5b068738c8631768e756917d4eef4a65f18da69ce4a03e5a1c212
return url
GUARD_HANDLE_REQUESt
auth42_REDIRECT
*/
