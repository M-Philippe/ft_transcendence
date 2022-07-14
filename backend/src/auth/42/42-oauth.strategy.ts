import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerifyCallback } from 'passport-oauth2';
// @ts-ignore
import { Strategy } from 'passport-42';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class OAuth42Strategy extends PassportStrategy(Strategy, '42') {
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService
    ) {
        super({
            authorizationURL: configService.get<string>("AUTHORIZATION_URL"),
            tokenURL: configService.get<string>("TOKEN_URL"),
            clientID: configService.get<string>("OAUTH_42_UID"),
            clientSecret: configService.get<string>("OAUTH_42_SECRET"),
            callbackURL: configService.get<string>("CALLBACK_URL"),
            scope: 'public',
            proxy: true,
        })
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ) {
        return ({
          id42: profile.id,
          username: profile.username,
          avatar: profile.photos[0].value,
        });
    }
}
