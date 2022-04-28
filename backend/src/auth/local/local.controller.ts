import { Body, Controller, HttpException, HttpStatus, Post, Res } from "@nestjs/common";
import { IsNotEmpty } from "class-validator";
import { Response } from "express";
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

	@Post("register")
	async registerUser(@Body() body: RegisterUserDto) {
		// Check that no user exist if this username.
		let user;
		try {
			user = await this.usersService.findOneByName(body.username);
		} catch (error) {}
		if (user)
			throw new HttpException({
				type: "Invalid name.",
				description: body.username + " is already taken, please choose another username",
			}, HttpStatus.BAD_REQUEST);

		// Check that password are equal.
		if (body.password !== body.confirmPassword)
			throw new HttpException({
				type: "Invalid password.",
				description: "Your two password aren't equal",
			}, HttpStatus.BAD_REQUEST);

		// Create user.
		try {
			await this.usersService.createUserLocal({
				name: body.username,
				password: body.password,
			});
		} catch (error) {
			throw new HttpException({
				description: "Server error",
			}, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Post("login")
  async connectUser(@Body() body: LoginUserDto, @Res() response: Response) {
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
		const jwtToken = await this.jwtAuthService.getAccessToken(payload.idUser, payload.twoFactorIsEnabled);
		//console.error("\n\nTOKEN: ", jwtToken.access_token, "\n\n");
		response.append("Access-Control-Expose-Headers", "Location");
		response.cookie("authentication", jwtToken.access_token, { httpOnly: true, sameSite: "strict" });
		if (payload.twoFactorIsEnabled) {
			response.location("http://localhost:3005/query2faCode");
		} else {
			console.error("AVATAR_RETURNED: ", payload.avatar);
			let queryString = "?id=" + payload.idUser + "&username=" + payload.username + "&avatar=" + payload.avatar;
			console.error("QUERY_STRING: ", queryString);
			response.location("http://localhost:3005/loginSuccess" + queryString);
		}
		response.send(JSON.stringify({
			username: payload.username,
			idUser: payload.idUser,
			avatar: payload.avatar
		}));
		return (response);
	}
}
