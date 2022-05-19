import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MatchesOnGoingService } from "./matchesOnGoing.service";
import { MatchesOnGoing } from "./entities/matchesOngoing.entity" ;
import { MatchesService } from "src/matches/matches.service";
import { CreateMatchDto } from 'src/matches/dto/create-match.dto';
import { SPEED_PALET_FRONT } from "./matchesOnGoing.constBoard";
import { Injectable, UseGuards, Inject, forwardRef } from "@nestjs/common";
import { extractJwtFromCookie, JwtGatewayGuard } from "src/guards/jwtGateway.guards";
import { JwtAuthService } from "src/auth/jwt/jwt-auth.service";
import { UsersService } from "src/users/users.service";
import internal from "stream";
import { join } from "path";

const FPS = 40;

interface match {
  move: number;
  powerUp: boolean;
  disconnect: boolean;
}

let updatePlayers = new Map<string, match>();

@WebSocketGateway({ transports: ['websocket'] })
@Injectable()
export class MatchesOnGoingGateway {
  constructor(private readonly matchesOnGoingService: MatchesOnGoingService,
              private readonly matchesService: MatchesService,
              private jwtService: JwtAuthService,
              @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService) {}

  @WebSocketServer()
  server: Server;

  async sendToAllSockets(match: MatchesOnGoing) {
    let tmp = {
      palletAX: match.palletAX,
      palletAY: match.palletAY,
      palletAWidth: match.palletAWidth,
      palletAHeight: match.palletAHeight,
      palletBX: match.palletBX,
      palletBY: match.palletBY,
      palletBWidth: match.palletBWidth,
      palletBHeight: match.palletBHeight,
      speedPallet: SPEED_PALET_FRONT,
      puckX: match.puckX,
      puckY: match.puckY,
      puckWidth: match.puckWidth,
      puckHeight: match.puckHeight,
      width: match.width,
      height: match.height,
      scoreA: match.scorePlayerA,
      scoreB: match.scorePlayerB,
      backgroundColor: match.bakckgroundColor,
      objectColor: match.objectColor,
      powerUpInvisible: match.powerUpInvisible,
      powerUpShrink: match.powerUpShrink,
      powerUpX: match.powerUpX,
      powerUpY: match.powerUpY,
      powerUpWidth: match.powerUpWidth,
      powerUpHeight: match.powerUpHeight,
      hasMessageToDisplay: match.hasMessageToDisplay,
      messageToDisplay: match.messageToDisplay,
      powerUpState: match.powerUpState,
    };
    for (let i = 0; i < match.players.length; i++) {
      this.server.to(match.players[i].socket).emit("updatePositions", {
        positions: tmp,
        id: match.id,
        palletAssigned: match.players[i].palletAssigned,
      });
    }
    for (let i = 0; i < match.socketsToEmit.length; i++)
      this.server.to(match.socketsToEmit[i]).emit("updatePositions", {
        positions: tmp,
        id: match.id,
    });
  }

  async sendEndGameToSockets(game: MatchesOnGoing) {
    for (let i = 0; i < game.players.length; i++)
      this.server.to(game.players[i].socket).emit("endGame");
    for (let i = 0; i < game.socketsToEmit.length; i++)
      this.server.to(game.socketsToEmit[i]).emit("endGame");
  }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage("fetchListGame")
  async fetchListGame(
    @ConnectedSocket() socket: Socket) {
      let response = await this.matchesOnGoingService.fetchListGame();
      if (response === undefined)
        return;
      this.server.to(socket.id).emit("receivedListGame", {
        listGame: response,
      });
    }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage("addSpectator")
  async addSpectator(
    @MessageBody() data: any,
    @ConnectedSocket() socket: Socket
  ) {
    await this.matchesOnGoingService.suscribeSpectator(data.idGame, socket.id);
  }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage("cancelMatch")
  async cancelMatch(
  @MessageBody() data: any,
  ) {
    await this.matchesOnGoingService.cancelMatch(data.username);
  }

  // @SubscribeMessage("movePallet")
  // async movePallet(
  // @MessageBody() data: any,
  // @ConnectedSocket() socket: Socket) {
  //   // Check that user is a player, check which pallet is assigned
  //   let response;
  //   if (data.direction !== "down" && data.direction !== "up")
  //     return;
  //   await this.matchesOnGoingService.movePalletPlayer(data.idGame, data.username, data.direction);
  // }

  // async handleDisconnect(client: any) {
	// 	console.error("DISCONNECT: ", client.id);
	// 	if (client.handshake.headers.cookie) {
	// 		//console.error("COOKIES: ", typeof(client.handshake.headers.cookie));
	// 		let cookie: string = client.handshake.headers.cookie;
	// 		let jwt = extractJwtFromCookie(client.handshake.headers.cookie);
	// 		try {
	// 			let payload = this.jwtService.verify(jwt);
	// 			//await this.usersService.setUserOfflineAndSocketToNull(payload.idUser);
  //       // updatePlayers.
  //     } catch (error) {}
	// 	}
	// }

  @SubscribeMessage("movePallet")
  async movePallet(
  @MessageBody() data: any,
  @ConnectedSocket() socket: Socket) {
    let p = updatePlayers.get(data.username);
    if (p == undefined)
      return;
    if (data.direction == "up")
      ++p.move;
    else if (data.direction == "down")
      --p.move;
    // await this.matchesOnGoingService.movePalletPlayer(data.idGame, data.username, data.direction);
  }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage('createMatch')
  async handleAsync(
  @MessageBody() data: any,
  @ConnectedSocket() socket: Socket) {
    if (data.map !== "original" && data.map !== "desert" && data.map !== "jungle")
      data.map = "original";
    if (data.scoreMax != 3 && data.scoreMax != 5 && data.scoreMax != 7)
      data.scoreMax = 3;
    // Check if user has a pending or disconnected game
    let existingGame = await this.matchesOnGoingService.checkUserAlreadyInGame(data.username, socket.id);
    if (existingGame !== undefined) {
      if (existingGame.pending) {
        this.server.to(socket.id).emit("alreadyCreatedMatch", {
          idGame: existingGame.id,
        });
        return;
      } else
        await this.sendToAllSockets(existingGame);
      return;
    }
    // Check if game pending with same rules (except map)
    let joinPendingGame = await this.matchesOnGoingService.checkSimilarGamePending(data, socket.id);
    if (joinPendingGame !== undefined) {
      this.server.to(joinPendingGame.players[1].socket).emit("idGame", {
        idGame: joinPendingGame.id,
      });
      this.usersService.setUserInGame(joinPendingGame.players[0].username, joinPendingGame.players[1].username);
      let m1: match = {move: 0, powerUp: false, disconnect: false};
      let m2: match = {move: 0, powerUp: false, disconnect: false};
      updatePlayers.set(joinPendingGame.players[0].username, m1);
      updatePlayers.set(joinPendingGame.players[1].username, m2);
      this.gameLoop(joinPendingGame);
      return;
    }
    let response: MatchesOnGoing;
    try {
      response = await this.matchesOnGoingService.createMatchFromGateway(data, socket.id);
    } catch (error) {
      return;
    }
    this.server.to(response.players[0].socket).emit("idGame", {
      idGame: response.id
    });
    return;
  }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage("userReadyToPlay")
  async userReadyToPlay(@ConnectedSocket() socket: Socket) {
    console.error("userReadyToPlay");
    if (socket.handshake.headers.cookie === undefined)
      return;
    let jwt = extractJwtFromCookie(socket.handshake.headers.cookie);
    let idUser: number;
    try {
      let payload = this.jwtService.verify(jwt);
      idUser = payload.idUser;
    } catch (error) {
      this.server.to(socket.id).emit("disconnectManual");
      return;
    }
    let matchOrId = await this.matchesOnGoingService.updatePlayerInvitationGame(idUser, socket.id);
    if (matchOrId === undefined) {
      return;
    } else if (typeof(matchOrId) === "number") {
      this.server.to(socket.id).emit("idGame", {
        idGame: matchOrId
      });
    } else if (typeof(matchOrId) === "object") {
      this.server.to(socket.id).emit("idGame", {
        idGame: matchOrId.id,
      });
      this.usersService.setUserInGame(matchOrId.players[0].username, matchOrId.players[1].username);
      this.gameLoop(matchOrId);
    } else
      return;
  }

  async gameLoop(match: MatchesOnGoing) {
    await this.sendToAllSockets(match);
    let pid: NodeJS.Timer;
    pid = setInterval(async () => {
      let game;
      game = await this.matchesOnGoingService.movePuck(match.id, updatePlayers);
      // see comments in movePuck why the undefined
      if (game === undefined)
        return;
      if (game.playerDisconnected)
        game = await this.matchesOnGoingService.checkTimeoutDisconnectedUser(game);
      if (game.finishedGame) {
        clearInterval(pid);
        await this.sendToAllSockets(game);
        let matchToSend = new CreateMatchDto;
        matchToSend.player1 = game.players[0].username;
        matchToSend.player2 = game.players[1].username;
        matchToSend.winner = game.winnerUsername;
        try {
          await this.matchesService.create(matchToSend);
        } catch (error) {
          console.error(error);
        }
        await this.sendEndGameToSockets(game);
        try {
          await this.matchesOnGoingService.deleteFromGateway(game);
        } catch (error) {
          console.error(error);
        }
        await this.usersService.checkUserAchievements(game.players[0].username);
        await this.usersService.checkUserAchievements(game.players[1].username);
        return;
      }
      await this.sendToAllSockets(game);
    }, 1000 / FPS);
  }
}
