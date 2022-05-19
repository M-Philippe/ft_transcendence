import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class Oauth42Guard extends AuthGuard('42') {
	handleRequest(err: Error, profileFromValidate: any, info: any) {
    // You can throw an exception based on either "info" or "err" arguments
		if (
      info
      && info.message ===
        'The resource owner or authorization server denied the request.'
    )
		return "failure";
    else if (err || !profileFromValidate) {
      throw err || new UnauthorizedException();
    }
    return profileFromValidate;
	}
}
