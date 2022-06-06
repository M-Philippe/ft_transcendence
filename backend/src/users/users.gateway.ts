import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtAuthService } from "src/auth/jwt/jwt-auth.service";
import { UsersService } from "./users.service";
import { UserAlert } from "./users.types";
import { extractJwtFromCookie } from "src/guards/jwtGateway.guards";

@WebSocketGateway( { path: "/user/userAlert", transports: ['websocket'] })
@Injectable()
export class UsersGateway implements OnGatewayConnection, OnGatewayDisconnect{
  constructor(
              @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
							private jwtService: JwtAuthService) {}

  @WebSocketServer()
  server: Server;

	async handleConnection(client: any, ...args: any[]) {
		// client.id is the same as socket.id
		// UseGuards support on handleConnection isn't implemented in nest.js, so we check jwt manually.
		if (client.handshake.headers.cookie) {
			let jwt = extractJwtFromCookie(client.handshake.headers.cookie);
			if (jwt === "") {
				this.server.to(client.id).emit("disconnectManual");
				return;
			}
			let payload;
			try {
				payload = this.jwtService.verify(jwt);
			} catch (error) {
				this.server.to(client.id).emit("disconnectManual");
				return;
			}
			await this.usersService.setUserOnline(payload.idUser, true);
			// send UserAlert
			console.error("USER_GATEWAY_CONNECTION: ", client.id);
			let userAlert = await this.usersService.updateSocketAndGetUserAlert(payload.idUser, client.id);
			if (userAlert === undefined || userAlert.alert === undefined || userAlert.alert.length === 0) {
				return;
			}
			this.server.to(userAlert.socket).emit("getUserAlert", {
				data: userAlert.alert
			});
		} else {
			this.server.to(client.id).emit("disconnectManual");
		}
	}

	async handleDisconnect(client: any) {
		console.error("USER_GATEWAY_DISCONNECT: ", client.id);
		if (client.handshake.headers.cookie) {
			let cookie: string = client.handshake.headers.cookie;
			let jwt = extractJwtFromCookie(client.handshake.headers.cookie);
			try {
				let payload = this.jwtService.verify(jwt);
				await this.usersService.setUserOfflineAndSocketToNull(payload.idUser);
			} catch (error) {}
		}
	}

	async contactUser(socket: string, message: string) {
		this.server.to(socket).emit("messageReceived", {
			message: message
		});
	}

	async contactUsers(socketOne: string, socketTwo: string, event: string) {
		this.server.to([socketOne, socketTwo]).emit(event);
	}

	async sendUserNewAlert(userAlert: UserAlert) {
		if (userAlert.socket === "")
			return;
		this.server.to(userAlert.socket).emit("getUserAlert", {
			data: userAlert.alert,
		});
	}
}
