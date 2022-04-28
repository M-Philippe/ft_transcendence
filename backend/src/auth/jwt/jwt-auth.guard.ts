import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	handleRequest(err: Error, profileFromValidate: any, info: any) {
    // You can throw an exception based on either "info" or "err" arguments
    console.error("GUARD_HANDLE_REQUEST");
    //console.error("\t\terr: ", err);
    //console.error("\t\tinfo: ", info);
    //console.error("\t\tUSER: ", profileFromValidate);
		if (err) {
			console.error("ERROR: ", err);
		}
		console.error("PROFILE: ", profileFromValidate);
		if (
      info
      && info.message ===
        'The resource owner or authorization server denied the request.'
    ) {
			console.error("FAILURE: ", info);
			return "failure";
		}
    else if (err || !profileFromValidate) {
      throw err || new UnauthorizedException();
    }
    return profileFromValidate;
	}
}
