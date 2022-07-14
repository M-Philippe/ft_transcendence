import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
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
		// //console.error("CLIENT_HANDSHAKE: ", client.handshake);
		//console.error("client handshake cookie: ", client.handshake.headers.cookie);
		if (client.handshake.headers.cookie) {
			let jwt = extractJwtFromCookie(client.handshake.headers.cookie);
			////console.error("JWT_RECEIVED_USER: ", jwt);
			if (jwt === "") {
				//console.error("jwt empty");
				this.server.to(client.id).emit("disconnectManual");
				return;
			}
			let payload;
			try {
				payload = this.jwtService.verify(jwt);
			} catch (error) {
				//console.error("bad jwt");
				this.server.to(client.id).emit("disconnectManual");
				return;
			}
			if (Date.now() - payload.dateEmitted > 14400000) {
				//console.error("jwt expired");
				this.server.to(client.id).emit("disconnectManual");
				return;
			}
			await this.usersService.setUserOnline(payload.idUser);
			// send UserAlert
			// //console.error("CLIENT_ID: ", client.id);
			let userAlert = await this.usersService.updateSocketAndGetUserAlert(payload.idUser, client.id);
			////console.error("USER_GATEWAY_CONNECTION: ", client.id , " | idUser: ", payload.idUser);
			if (userAlert === undefined) {
				return;
			}
			let u = await this.usersService.findOne(payload.idUser);
			//console.error("connected : ", u.id, ", online: ", u.online, ", socket: ", u.socketAlert);
			this.server.to(client.id).emit("getUserAlert", {
				data: userAlert
			});
		} else {
			//console.error("handshake headers cookie empty");
			this.server.to(client.id).emit("disconnectManual");
		}
	}

	async handleDisconnect(client: any) {
		if (client.handshake.headers.cookie) {
			// let cookie: string = client.handshake.headers.cookie;
			let jwt = extractJwtFromCookie(client.handshake.headers.cookie);
			try {
				let payload = this.jwtService.verify(jwt);
				await this.usersService.setUserOfflineAndSocketToNull(payload.idUser);
				//console.error("user disconnect: ", payload.idUser, " with socket: ", client.id, "\n");
			} catch (error) {}
		}
		// //console.error("user disconnected: ", )
	}

	async contactUser(socket: string, message: string) {
		this.server.to(socket).emit("messageReceived", {
			message: message
		});
	}

	async contactUsers(socketOne: string, socketTwo: string, event: string) {
		this.server.to([socketOne, socketTwo]).emit(event);
	}

	async sendUserNewAlert(socketToContact: string, userAlert: UserAlert[]) {
		if (socketToContact === "")
			return;
		//console.error("alert send to: ", socketToContact, "\n\n");
		this.server.to(socketToContact).emit("getUserAlert", {
			data: userAlert,
		});
	}
}
