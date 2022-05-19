import { CanActivate, ExecutionContext, forwardRef, Inject, Injectable, Req, UseGuards } from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtAuthService } from "src/auth/jwt/jwt-auth.service";

export function extractJwtFromCookie(cookies: string) {
	let keys = cookies.split(";");
	let jwt = "";
	for (let i = 0; i < keys.length; i++) {
		if (keys[i].search("authentication=") != -1) {
			if (keys.length == 1) {
				jwt = keys[i].slice("authentication=".length);
			} else {
				jwt = keys[i].slice("authentication=".length + 1);
			}
			return (jwt);
		}
	}
	return (jwt);
}

@Injectable()
export class JwtGatewayGuard implements CanActivate {
	constructor(
		@Inject(forwardRef(() => JwtAuthService)) private jwtService: JwtAuthService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		// It is also possible to get data from context.
		let contextSocket = context.switchToWs().getClient();
		let cookie: string | undefined = contextSocket.handshake.headers.cookie;
		if (cookie === undefined)
			return (false);
		let jwt = extractJwtFromCookie(cookie);
		if (jwt === "") {
			return (false);
		}
		try {
			let payload = this.jwtService.verify(jwt);
		} catch (error) {
			return (false);
		}
		return (true);
	}
}
