import { CanActivate, ExecutionContext, forwardRef, Inject, Injectable, Req, UseGuards } from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtAuthService } from "src/auth/jwt/jwt-auth.service";

export function extractJwtFromCookie(cookies: string) {
	let keys = cookies.split(";");
	let jwt = "";
	for (let i = 0; i < keys.length; i++) {
		if (keys[i].search("authentication=") != -1) {
			// console.error('BEFORE SLICE: ', keys[i]);
			if (keys.length == 1) {
				// console.error("\n\n\tNO OTHER COOKIES\n\n");
				jwt = keys[i].slice("authentication=".length);
			} else {
				jwt = keys[i].slice("authentication=".length + 1);
				// console.error("\n\n\tPRESENT OTHER COOKIES\n\n");
			}
			// console.error("AFTER SLICE: ", jwt);
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
		// console.error("\n\n\tJWT_GATEWAY_GUARD\n\n");
		let contextSocket = context.switchToWs().getClient();
		//console.log("CONTEXT: ", contextSocket);
		let cookie: string | undefined = contextSocket.handshake.headers.cookie;
		//console.error("COOKIE: ", cookie);
		if (cookie === undefined)
			return (false);
		let jwt = extractJwtFromCookie(cookie);
		// console.error("JWT_TOKEN: ", jwt);
		if (jwt === "") {
			console.error("JWT_EMPTY: ");
			return (false);
		}
		try {
			let payload = this.jwtService.verify(jwt);
			// console.error("VERIFY_SOCKET_TOKEN: ", payload);
		} catch (error) {
			// console.error("\nTOKEN_EXPIRED: ", error);
			return (false);
		}
		return (true);
	}
}
