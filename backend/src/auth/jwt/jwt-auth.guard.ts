import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	handleRequest(err: Error, profileFromValidate: any, info: any) {
    // You can throw an exception based on either "info" or "err" arguments
		if (err) {
			//console.error("ERROR: ", err);
		}
		if (
      info
      && info.message ===
        'The resource owner or authorization server denied the request.'
    ) {
			//console.error("FAILURE: ", info);
			return "failure";
		}
    else if (err || !profileFromValidate) {
      throw err || new UnauthorizedException();
    }
    return profileFromValidate;
	}
}
