import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { JwtAuthService } from "../auth/jwt/jwt-auth.service";

@Injectable()
export class JwtGuard implements CanActivate {
	constructor(
		private jwtService: JwtAuthService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
			const request = context.switchToHttp().getRequest();
			return this.validateRequest(request);
	}

	async validateRequest(request: Request) {
		if (!request.cookies || !request.cookies.authentication) {
			console.error(request);
			return (false);
		}
		let jwt = request.cookies.authentication;
		console.error("JWT: ", jwt);
		let payload;
		try {
			payload = this.jwtService.verify(jwt);
			console.error("VERIFY: ", payload);
		} catch (error) {
			console.error("Token Expired");
			return (false);
		}
		if (payload.isTwoFactorAuthenticated && !payload.hasProvidedTwoFactorCode) {
			return (false);
		}
		return (true);
	}
}

@Injectable()
export class JwtGuardWaiting2faCode implements CanActivate {
	constructor(
		private jwtService: JwtAuthService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest();
		return this.validateRequest(request);
	}

	async validateRequest(request: Request) {
		//console.error(request);
		if (!request.cookies || !request.cookies.authentication) {
			return (false);
		}
		let jwt = request.cookies.authentication;
		console.error("JWT: ", jwt);
		let payload;
		try {
			payload = this.jwtService.verify(jwt);
			//console.error("VERIFY_WAITING: ", payload);
		} catch (error) {
			console.error("Token Expired");
			return (false);
		}
		// isTwoFactorAuthenticated
		if (!payload.isTwoFactorAuthenticated || payload.hasProvidedTwoFactorCode) {
			return (false);
		}
		return (true);
	}
}
