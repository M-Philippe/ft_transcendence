import { Req, Request, Body, Controller, HttpException, HttpStatus, Post, Res } from "@nestjs/common";
import { IsNotEmpty } from "class-validator";
import { Response } from "express";
import { FRONT_LOGIN_SUCCESS, FRONT_QUERY_2FA_CODE } from "src/urlConstString";
import { UsersService } from "src/users/users.service";
import { JwtAuthService } from "../jwt/jwt-auth.service";

class RegisterUserDto {
	@IsNotEmpty()
	username: string;

	@IsNotEmpty()
	password: string;

	@IsNotEmpty()
	confirmPassword: string;
}

class LoginUserDto {
  @IsNotEmpty()
	username: string;

	@IsNotEmpty()
	password: string;
}

@Controller("auth/local")
export class LocalController {
	constructor(
		private usersService: UsersService,
		private jwtAuthService :JwtAuthService,) {}

	checkCharacterPasssword(password: string) {
		const specChar = "(?$#&!;)";
		let hasNumber: boolean = false;
		let hasSpec: boolean = false;
		let hasUp: boolean = false;
		let hasLower: boolean = false;
		for (let i = 0; i < password.length; i++) {
			if (!hasSpec && specChar.includes(password[i]))
				hasSpec = true;
			if (!hasNumber && !isNaN(parseInt(password[i])))
				hasNumber = true;
			if (!hasUp && (password[i] >= 'A' && password[i] <= 'Z'))
				hasUp = true;
			if (!hasLower && (password[i] >= 'a' && password[i] <= 'z'))
				hasLower = true;
		}
		return (hasNumber && hasSpec && hasUp && hasLower);
	}

	@Post("register")
	async registerUser(@Body() body: RegisterUserDto) {
		// Check that no user exist if this username.
		//console.error("REGISTER");
		let user;
		try {
			user = await this.usersService.findOneByName(body.username);
		} catch (error) {}
		if (user)
			throw new HttpException({
				type: "Invalid name.",
				message: body.username + " is already taken, please choose another username",
			}, HttpStatus.BAD_REQUEST);

		// Check that password are equal.
		if (body.password !== body.confirmPassword)
			throw new HttpException({
				type: "Invalid password.",
				message: "Your two password aren't equal",
			}, HttpStatus.BAD_REQUEST);

		// Check limit-length
		if (body.username.length < 3 || body.username.length >= 12)
			throw new HttpException({
				type: "Invalid name.",
				message: "username too short or too long (3 < username <= 12)"
			}, HttpStatus.BAD_REQUEST);
		if (body.password.length < 6 || body.password.length >= 18)
			throw new HttpException({
				type: "Invalid password.",
				message: "password too short or too long (6 < password <= 18)"
			}, HttpStatus.BAD_REQUEST);
		if (!this.checkCharacterPasssword(body.password))
			throw new HttpException({
				type: "Invalid password.",
				message: "Your password must contain at leat, one number, one upper, one lower and one special character (?$#&!;)"
			}, HttpStatus.BAD_REQUEST);
		// Create user.
		try {
			await this.usersService.createUserLocal({
				name: body.username,
				password: body.password,
			});
		} catch (error) {
			throw new HttpException({
				message: "Server error",
			}, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Post("login")
  async connectUser(@Req() request: any, @Body() body: LoginUserDto, @Res() response: Response) {
	//console.error("LOGIN");
	let payload;
		try {
			payload = await this.usersService.checkInputCredentials(body.username, body.password);
		} catch (error) {
			throw new HttpException({
        code: "e2301",
				type: "Invalid credentials.",
        description: "Invalid credentials."
      }, HttpStatus.UNAUTHORIZED);
		}
		// generate Jwt.
		const jwt = await this.jwtAuthService.getAccessToken(payload.idUser, payload.twoFactorIsEnabled);
		response.append("Access-Control-Expose-Headers", "Location");

		if (request.headers["user-agent"] !== undefined &&
		(request.headers["user-agent"].indexOf("Chrome") !== -1 || request.headers["user-agent"].indexOf("Firefox") !== -1))
        	response.cookie("authentication", jwt.access_token, { httpOnly: true, sameSite: "strict", secure: false });
      	else if (request.headers["user-agent"] !== undefined && request.headers["user-agent"].indexOf("Safari") !== -1)
        	response.cookie("authentication", jwt.access_token, { httpOnly: true, sameSite: "none", secure: false });
      	else
        	response.cookie("authentication", jwt.access_token, { httpOnly: true, sameSite: "none"});


		if (payload.twoFactorIsEnabled) {
			response.location(FRONT_QUERY_2FA_CODE);
		} else {
			let queryString = "?id=" + payload.idUser + "&username=" + payload.username + "&avatar=" + payload.avatar;
			response.location(FRONT_LOGIN_SUCCESS + queryString);
		}
		response.send(JSON.stringify({
			username: payload.username,
			idUser: payload.idUser,
			avatar: payload.avatar
		}));
		return (response);
	}
}
