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
            //authorizationURL: 'https://api.intra.42.fr/oauth/authorize?client_id=ed0b86fd834fae7e8171d1f8dc0a84ef3586cec062339193fe00184dbf7fa685&redirect_uri=http%3A%2F%2F10.1.4.3%3A3000%2Fauth%2F42%2Fredirect&response_type=code',
            authorizationURL: 'https://api.intra.42.fr/oauth/authorize?client_id=ed0b86fd834fae7e8171d1f8dc0a84ef3586cec062339193fe00184dbf7fa685&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2F42%2Fredirect&response_type=code',
            tokenURL: 'https://api.intra.42.fr/oauth/token',
            clientID: configService.get<string>("OAUTH_42_UID"),
            clientSecret: configService.get<string>("OAUTH_42_SECRET"),
            callbackURL: "http://localhost:3000/auth/42/redirect",
            scope: 'public',
            proxy: true,

            //state: configService.get<string>("OAUTH_42_STATE"),
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
