import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MatchesOnGoingService } from "./matchesOnGoing.service";
import { MatchesOnGoing } from "./entities/matchesOngoing.entity" ;
import { MatchesService } from "src/matches/matches.service";
import { CreateMatchDto } from 'src/matches/dto/create-match.dto';
import { BOARD_HEIGHT, SPEED_PALET_FRONT, SPEED_PALLET, START_PALLET_HEIGHT } from "./matchesOnGoing.constBoard";
import { Injectable, UseGuards, Inject, forwardRef } from "@nestjs/common";
import { extractJwtFromCookie, JwtGatewayGuard } from "src/guards/jwtGateway.guards";
import { JwtAuthService } from "src/auth/jwt/jwt-auth.service";
import { UsersService } from "src/users/users.service";
import { User } from "src/users/entities/user.entity";
import { Connection, getConnection, Repository } from "typeorm";

import internal from "stream";
import { join } from "path";
// import { DataTypeNotSupportedError, getConnection, MetadataWithSuchNameAlreadyExistsError } from "typeorm";
// import {Mutex, MutexInterface, Semaphore, SemaphoreInterface, withTimeout} from 'async-mutex';
// import { Mutex }from 'async-mutex';
// import {Mutex, MutexInterface, Semaphore, SemaphoreInterface, withTimeout} from 'async-mutex';


const FPS = 80;

// type HashMap<T> = { [key: string]: T };

interface IQueue {
  id: number,
  rules: string,
  socket: string,
}

const queue = new Map<number /* timestamp */, IQueue>();

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
  @ConnectedSocket() socket: Socket,
  ) {
    if (socket.handshake.headers.cookie === undefined)
      return;
    let idUser: number = 0;
    try {
      const jwtToken = extractJwtFromCookie(socket.handshake.headers.cookie);
      idUser = await this.jwtService.verify(jwtToken).idUser;
    } catch (error) { return; }
    for (let entries of queue.entries()) {
      if (entries[1].id === idUser) {
        queue.delete(entries[0]);
        this.printQueue();
        return;
      }
    }
  }

  async handleDisconnect(client: any) {
		if (client.handshake.headers.cookie) {
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
          .where("p1 = :name1", { name1: usr.name })
          .orWhere("p2 = :name2", { name2: usr.name })
          .getOneOrFail();
        if (game.pending) {
          await getConnection()
                .createQueryBuilder()
                .delete()
                .from(MatchesOnGoing)
                .where("id = :id", { id: game.id })
                .execute();
          this.usersService.setNotInGame(game.p1);
          this.usersService.setNotInGame(game.p2);
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
      } catch (error) {}
		}
	}

  @SubscribeMessage("movePallet")
  async movePallet(
  @MessageBody() data: any,
  @ConnectedSocket() socket: Socket) {
    // let d = Date.now();
    if (data.direction === "up") {
      if (data.palletAssigned === 0)
        await getConnection().createQueryBuilder().update(MatchesOnGoing).set({palletayfromuser: () => "palletayfromuser - 1"}).where("p1 = :name", {name: data.username}).execute();
      else
        await getConnection().createQueryBuilder().update(MatchesOnGoing).set({palletbyfromuser: () => "palletbyfromuser - 1"}).where("p2 = :name", {name: data.username}).execute();
    } else if (data.direction === "down") {
      if (data.palletAssigned === 0)
        await getConnection().createQueryBuilder().update(MatchesOnGoing).set({palletayfromuser: () => "palletayfromuser + 1"}).where("p1 = :name", {name: data.username}).execute();
      else
        await getConnection().createQueryBuilder().update(MatchesOnGoing).set({palletbyfromuser: () => "palletbyfromuser + 1"}).where("p2 = :name", {name: data.username}).execute();
    }
    // console.error("Mvt " + data.username + ": " + (Date.now() - d));
  }

  checkUserAlreadyInQueue(idUser: number) {
    for (let value of queue.values())
      if (value.id === idUser)
        return true;
    return false;
  }

  disassembleRulesString(rulesToDisassemble: string) {
    let parsedRules: {powerUp: boolean, scoreMax: number, map: "original" | "desert" | "jungle"}
      = { powerUp: false, scoreMax: 3, map: "original"};
    let rules = rulesToDisassemble;
    rules.indexOf("(");
    let rulesReturn = rules.substring(rules.indexOf("("));
    let arrayRules = rules.split("#");
    parsedRules.scoreMax = parseInt(arrayRules[0].substring(arrayRules[0].indexOf(":") + 1));
    parsedRules.powerUp
      = (arrayRules[1].substring(arrayRules[1].indexOf(":") + 1)) === "yes" ? true : false;
    let mapExtracted = arrayRules[2].substring(arrayRules[2].indexOf(":") + 1, arrayRules[2].length - 1);
    if (mapExtracted === "original" || mapExtracted === "desert" || mapExtracted === "jungle")
    parsedRules.map = mapExtracted;
    return parsedRules;
  }

  assembleRulesString(rules: any) {
    let assembledRulesString =
      "(points:" + rules.scoreMax
      + "#power-up:" + (rules.powerUp ? "yes" : "no")
      + "#map:" + rules.map + ")";
    return assembledRulesString;
  }

  checkSimilarGame(idUser: number, rulesConcat: string) {
    let rulesSearching = this.disassembleRulesString(rulesConcat);
    for (let entries of queue.entries()) {
      let rulesPulled = this.disassembleRulesString(entries[1].rules);
      if (rulesPulled.scoreMax === rulesSearching.scoreMax && rulesPulled.powerUp === rulesSearching.powerUp) {
        queue.delete(entries[0]);
        return { response: true, playerOneId: entries[1].id, playerTwoId: idUser, rules: rulesPulled, socketUserOne: entries[1].socket };
      }
    }
    return { response: false, playerOneId: 0, playerTwoId: 0, rules: rulesSearching, socketUserOne: "" };
  }

  removeUserFromQueue(idUser: number) {
    for (let entries of queue.entries())
      if (entries[1].id === idUser)
        queue.delete(entries[0]);
  }

  printQueue() {
    console.error("\t=== PRINT_QUEUE ===");
    for (let entries of queue.entries()) {
      console.error(entries[0], " | ", entries[1]);
    }
  }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage('createMatch')
  async handleAsync(
  @MessageBody() data: any,
  @ConnectedSocket() socket: Socket) {
    /* NEW_CODE */
    if (socket.handshake.headers.cookie === undefined) {
      socket.disconnect();
      return;
    }
    let idUser: number = 0;
    try {
      const jwtToken = extractJwtFromCookie(socket.handshake.headers.cookie);
      idUser = await this.jwtService.verify(jwtToken).idUser;
    } catch (error) {
      socket.disconnect();
      return;
    }

    const user = await this.usersService.findOne(idUser);
    await this.usersService.setInGame(data.username);
    let rulesConcat = this.assembleRulesString(data);
    let responseMatchmaking: MatchesOnGoing | undefined;
    let responseCheckSimilar: {response: boolean, playerOneId: number, playerTwoId: number, socketUserOne: string, rules: { powerUp: boolean, scoreMax: number, map: "original" | "desert" | "jungle"}};
    if ((responseMatchmaking = (await this.matchesOnGoingService.findOneWithUser(user.name))) !== undefined) { // 1. We can reconnect player to his previous game
      //await this.matchesOnGoingService.updateSocketPlayers(responseMatchmaking, socket.id, user.inGame);
      this.server.to(socket.id).emit("alreadyCreatedMatch", { idGame: responseMatchmaking.id});
    } else if (this.checkUserAlreadyInQueue(idUser)) { // 2. Search continue
      this.server.to(socket.id).emit("alreadyCreatedMatch", { idGame: -1 });
    } else if ((responseCheckSimilar = this.checkSimilarGame(idUser, rulesConcat)).response) { // 3. We create the match
      /* Users are already deleted from queue. */
      let createdGame =
        await this.matchesOnGoingService.createMatchFromGateway(
          responseCheckSimilar.playerOneId,
          responseCheckSimilar.playerTwoId,
          responseCheckSimilar.rules,
          responseCheckSimilar.socketUserOne,
          socket.id);
      if (createdGame === undefined) {
        socket.disconnect();
        // disconnect second socket.
        return;
      }
      this.server.to([responseCheckSimilar.socketUserOne, socket.id]).emit("idGame", { idGame: createdGame.id });
      this.gameLoop(createdGame);
    } else { // 4. Simply add to queue
      queue.set(Date.now(), { id: idUser, rules: rulesConcat, socket: socket.id })
    }
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
      this.usersService.setInGame(matchOrId.p1, 1);
      this.usersService.setInGame(matchOrId.p2, 2);
      // this.usersService.setUserInGame(matchOrId.players[0].username, matchOrId.players[1].username);
      this.gameLoop(matchOrId);
    } else
      return;
  }

  async gameLoop(match: MatchesOnGoing) {
    await this.sendToAllSockets(match);
    let pid: NodeJS.Timer;
    let y = 0;
    let c = 0;
    // let d = Date.now();
    pid = setInterval(async () => {
      // d = Date.now();
      let game = await this.matchesOnGoingService.movePuck(match.id);
      // let game = await this.matchesOnGoingService.movePuck(match.id, updatePlayers[match.p1], updatePlayers[match.p2]);
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
        await this.usersService.setNotInGame(game.p1);
        await this.usersService.setNotInGame(game.p2);
        console.error("moy: " + y / c);
        return;
      }
      // let a = updatePlayers[match.p1];
      // updatePlayers[match.p1] = 0;
      // updatePlayers[match.p2] = 0;
      await this.sendToAllSockets(game);
      // ++c;
      // y += Date.now()- d;
    }, 1000 / FPS);
  }
}
