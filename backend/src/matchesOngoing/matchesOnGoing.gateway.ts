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
import { User } from "src/users/entities/user.entity";
import internal from "stream";
import { join } from "path";
import { getConnection } from "typeorm";

const FPS = 60;

type HashMap<T> = { [key: string]: T };

const updatePlayers: HashMap<number> = {};

// let updatePlayers = new Map<string, match>();

@WebSocketGateway({ path:"/matchesOnGoing", transports: ['websocket'] })
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

  async handleDisconnect(client: any) {
		if (client.handshake.headers.cookie) {
      console.error("\n-----> PLAYER DISCONNECTED IN GAME <----- " + Date.now());
			// console.error("COOKIES: ", typeof(client.handshake.headers.cookie));
			let jwt = extractJwtFromCookie(client.handshake.headers.cookie);
			try {
				let payload = this.jwtService.verify(jwt);
        let usr: User = await getConnection()
          .getRepository(User)
          .createQueryBuilder('user')
          .where("id = :id", { id: payload.idUser})
          .getOneOrFail();
        let game: MatchesOnGoing = await getConnection()
          .getRepository(MatchesOnGoing)
          .createQueryBuilder('game')
          .where("p1 = :name", { name: usr.name })
          .orWhere("p2 = :name", { name: usr.name })
          .getOneOrFail();
        if (game.pending) {
          await getConnection()
                .createQueryBuilder()
                .delete()
                .from(MatchesOnGoing)
                .where("id = :id", { id: game.id })
                .execute();
        }
        else {
          await getConnection()
                .createQueryBuilder()
                .update(MatchesOnGoing)
                .set({
                  playerDisconnected: true,
                  usernameDisconnectedPlayer: usr.name,
                  timeOfDisconnection: Date.now(),
                })
                .where("id = :id", { id: game.id })
                .execute();
        }
        console.error("----->" + usr.name + "<-----\n");
      } catch (error) {}
		}
	}

  @SubscribeMessage("movePallet")
  async movePallet(
  @MessageBody() data: any,
  @ConnectedSocket() socket: Socket) {
    console.error(data.username);
    if (data.direction == "up")
      --updatePlayers[data.username];
    else if (data.direction == "down")
      ++updatePlayers[data.username];
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
      updatePlayers[joinPendingGame.players[0].username] = 0;
      updatePlayers[joinPendingGame.players[1].username] = 0;
      console.error("Add the two players in the map");
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
      let game = await this.matchesOnGoingService.movePuck(match.id, updatePlayers[match.p1], updatePlayers[match.p2]);
      if (game === undefined)
        return;
      if (game.playerDisconnected)
        game = await this.matchesOnGoingService.checkTimeoutDisconnectedUser(game);

      /*          Finished Game         */
      if (game.finishedGame) {
        clearInterval(pid);
        await this.sendToAllSockets(game);
        let matchToSend = new CreateMatchDto;
        matchToSend.player1 = game.p1;
        matchToSend.player2 = game.p2;
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
        await this.usersService.checkUserAchievements(game.p1);
        await this.usersService.checkUserAchievements(game.p2);
        return;
      }
      let a = updatePlayers[match.p1];
      updatePlayers[match.p1] = 0;
      updatePlayers[match.p2] = 0;
      await this.sendToAllSockets(game);
    }, 1000 / FPS);
  }
}
