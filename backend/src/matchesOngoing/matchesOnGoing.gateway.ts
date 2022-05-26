import { ListGame, IQueue,  GameMap, Game, Ball, Player, Coord, Mvts, PowerUp, Results, Disconnesction, Const, Message} from "./matchesOnGoing.interfaces";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MatchesOnGoingService } from "./matchesOnGoing.service";
import { MatchesService } from "src/matches/matches.service";
import { CreateMatchDto } from 'src/matches/dto/create-match.dto';
import { BOARD_HEIGHT, SPEED_PALET_FRONT, SPEED_PALLET, START_PALLET_HEIGHT, START_PALLET_WIDTH } from "./matchesOnGoing.constBoard";
import { Injectable, UseGuards, Inject, forwardRef } from "@nestjs/common";
import { extractJwtFromCookie, JwtGatewayGuard } from "src/guards/jwtGateway.guards";
import { JwtAuthService } from "src/auth/jwt/jwt-auth.service";
import { UsersService } from "src/users/users.service";
import { User } from "src/users/entities/user.entity";
import { getConnection} from "typeorm";


const FPS = 60;

const queue = new Map<number /* timestamp */, IQueue>();

@WebSocketGateway({ path:"/matchesOnGoing/matchesOnGoingSocket", transports: ['websocket'] })
@Injectable()
export class MatchesOnGoingGateway {
  constructor(private readonly matches: MatchesOnGoingService,
              private readonly matchesService: MatchesService,
              private jwtService: JwtAuthService,
              @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService) {}

  private games: GameMap = {};
  private count: number = 0;

  @WebSocketServer()
  server: Server;

  /*				Queue				*/
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
        this.usersService.setNotInGame(entries[1].name);
        queue.delete(entries[0]);
		    // this.printQueue();
        return;
      }
    }
  }

  checkUserAlreadyInQueue(idUser: number, socket: string) {
    for (let value of queue.values()) {
    	if (value.id === idUser) {
			this.server.to(socket).emit("alreadyCreatedMatch", { idGame: -1 });
      // console.error("Already in Queue");
			return true;
		}
	}
    return false;
  }

  disassembleRulesString(rulesToDisassemble: string) {
    let parsedRules: {powerUp: boolean, scoreMax: number, map: "original" | "desert" | "jungle"}
      = { powerUp: false, scoreMax: 3, map: "original"};
    let rules = rulesToDisassemble;
    rules.indexOf("(");
    // let rulesReturn = rules.substring(rules.indexOf("("));
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
        return { response: true, playerOneId: entries[1].id, playerTwoId: idUser, socketUserOne: entries[1].socket, playerOneName: entries[1].name, rules: rulesConcat };
      }
    }
    return { response: false, playerOneId: 0, playerTwoId: 0, playerOneName: "", rules: "", socketUserOne: "" };
  }

  removeUserFromQueue(idUser: number) {
    for (let entries of queue.entries())
      if (entries[1].id === idUser) {
        queue.delete(entries[0]);
        return true;
      }
    return false;
  }

  printQueue() {
    console.error("\t=== PRINT_QUEUE ===");
    for (let entries of queue.entries()) {
      console.error(entries[0], " | ", entries[1]);
    }
    console.error("\t===================");
  }

  /*				Sockets				*/
  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage("addSpectator")
  addSpectator(
    @MessageBody() data: any,
    @ConnectedSocket() socket: Socket)
  {
	  this.games[data.id].socketToEmit.push(socket.id);
  }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage("fetchListGame")
  fetchListGame(
  @ConnectedSocket() socket: Socket) {
    let response = this.ListGame();
    if (response === undefined)
      return;
    this.server.to(socket.id).emit("receivedListGame", {
      listGame: response,
    });
  }

  async sendToAllSockets(game: Game, idGame: number) {
    let tmp = {
      idGame: game.id,
      palletAX: game.players.p1.coord.x,
      palletAY: game.players.p1.coord.y,
      palletL: START_PALLET_WIDTH,
      palletAHeight: game.players.p1.coord.h,
      palletBX: game.players.p2.coord.x,
      palletBY: game.players.p2.coord.y,
      palletBHeight: game.players.p2.coord.h,
      speedPallet: SPEED_PALET_FRONT,
      puckX: game.ball.x,
      puckY: game.ball.y,
      puckR: game.ball.r,
      width: game.const.width,
      height: game.const.height,
      scoreA: game.result.scoreP1,
      scoreB: game.result.scoreP2,
      backgroundColor: game.const.backgroundColor,
      objectColor: game.const.objectColor,
      powerUpInvisible: game.powerUp.Invisible,
      powerUpShrink: game.powerUp.Shrink,
      powerUpX: game.powerUp.x,
      powerUpY: game.powerUp.y,
      powerUpL: game.powerUp.l,
      hasMessageToDisplay: game.msg.hasMessageToDisplay,
      messageToDisplay: game.msg.messageToDisplay,
      powerUpState: game.powerUp.State,
      powerUpGenerate: game.powerUp.generate,
    };
  // console.error("Ball: ", game.ball.x, " - " , game.ball.y, " - ", game.ball.r);
	this.server.to(game.players.p1.socket).emit("updatePositions", {
        positions: tmp,
		id: idGame,
		palletAssigned: 0
	})
	this.server.to(game.players.p2.socket).emit("updatePositions", {
        positions: tmp,
		id: idGame,
		palletAssigned: 1
	})
    for (let i = 0; i < game.socketToEmit.length; i++)
      this.server.to(game.socketToEmit[i]).emit("updatePositions", {
        positions: tmp,
        id: idGame,
    });
  }

  sendEndGameToSockets(id: number) {
	this.sendToAllSockets(this.games[id], id);
	this.server.to(this.games[id].players.p1.socket).emit("endGame");
	this.server.to(this.games[id].players.p2.socket).emit("endGame");
    for (let i = 0; i < this.games[i].socketToEmit.length; i++)
      this.server.to(this.games[id].socketToEmit).emit("endGame");
  }

  updateSocketPlayers(id: number, socket: string, p1: boolean) {
	  if (p1)
	  	this.games[id].players.p1.socket = socket;
	  else
		this.games[id].players.p2.socket = socket;
	this.games[id].msg.hasMessageToDisplay = false;
	this.games[id].msg.messageToDisplay = "";
	this.games[id].disconnect.username = "";
  }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage("userReadyToPlay")
  async userReadyToPlay(@ConnectedSocket() socket: Socket) {
    if (socket.handshake.headers.cookie === undefined)
      return;
    let jwt = extractJwtFromCookie(socket.handshake.headers.cookie);
    let idUser: number;
    let usr: User;
    try {
      let payload = this.jwtService.verify(jwt);
      idUser = payload.idUser;
      usr = await getConnection()
      .getRepository(User)
      .createQueryBuilder('user')
      .where("id = :id", { id: payload.idUser})
      .getOneOrFail();
    } catch (error) {
      this.server.to(socket.id).emit("disconnectManual");
      return;
    }
    let idx = this.findGameById(idUser);
    if (idx === -1) {
      this.server.to(socket.id).emit("disconnectManual");
      return;
    }
    this.server.to(socket.id).emit("idGame", {
      idGame: idx
    });
    this.usersService.setInGame(usr.name, true);
    // console.error(usr.name, " ready to play");
    if (this.games[idx].players.p1.id === usr.id) {
      this.games[idx].players.p1 = this.matches.initPlayer(usr.id, usr.name, socket.id, 1);
      if (this.games[idx].players.p2.socket !== "")
        this.gameLoop(this.games[idx]);
    } else if (this.games[idx].players.p2.id === usr.id) {
      this.games[idx].players.p2 = this.matches.initPlayer(usr.id, usr.name, socket.id, 2);
      if (this.games[idx].players.p1.socket !== "")
        this.gameLoop(this.games[idx]);
    }
    return;
  }

  /*    Game Search       */

  ListGame() {
    let ret: ListGame[] = [];
    for (let i = 0; i < this.count; i++) {
      if (this.games[i].inUse) {
        ret.push({
          idGame: this.games[i].id,
          playerOne: this.games[i].players.p1.name,
          playerTwo: this.games[i].players.p2.name,
        });
      }
    }
    return (ret);
  }

  findGameByName(name: string) {
    for (let i = 0; i < this.count; ++i)
		  if (this.games[i].players.p1.name === name || this.games[i].players.p2.name === name)
        return i;
    return -1;
  }

  findGameById(id: number) {
    for (let i = 0; i < this.count; ++i)
		  if (this.games[i].players.p1.id === id || this.games[i].players.p2.id === id)
        return i;
    return -1;
  }

  /*			Matchmaking			*/

  createMatchFromInvitation(playerOne: number, playerTwo: number, rules: string) {
    this.createGame(playerOne, "", "", playerTwo, "", "", rules, true);
  }

  alreadyAMatch(usr: User, socket: string) {
    let id = this.findGameById(usr.id);
    if (id != -1 && this.games[id].inUse) {
			if (this.games[id].players.p1.id === usr.id)
				this.games[id].players.p1.socket = socket;
			else
				this.games[id].players.p2.socket = socket;
			this.games[id].msg.hasMessageToDisplay = false;
			this.games[id].msg.messageToDisplay = "";
			this.games[id].disconnect.username = "";
			this.server.to(socket).emit("alreadyCreatedMatch", { idGame: id});
      // console.error(usr.name, " already have a match, id: ", id);
			return true;
		}
    return false;
	}

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage('createMatch')
  async handleAsync(
  @MessageBody() data: any,
  @ConnectedSocket() socket: Socket) {
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
  	await this.usersService.setInGame(data.username, true);
  	let rulesConcat = this.assembleRulesString(data);
  	if (!this.alreadyAMatch(user, socket.id) && !this.checkUserAlreadyInQueue(idUser, socket.id)) {
  		let similar: {response: boolean, playerOneId: number, playerTwoId: number, socketUserOne: string, playerOneName: string, rules: string};
  		if ((similar = this.checkSimilarGame(idUser, rulesConcat)).response) {
        // console.error(user.name,  " find ", similar.playerOneName, " waiting in the queue.");
			  this.createGame(
				  similar.playerOneId,
				  similar.playerOneName,
				  similar.socketUserOne,
				  similar.playerTwoId,
				  user.name,
				  socket.id,
				  similar.rules,
          false,
			  )
		} else {
			queue.set(Date.now(), { id: idUser, name: user.name, rules: rulesConcat, socket: socket.id })
      // console.error(user.name, " is waiting in the queue.");
		}
	}
  }

  async handleDisconnect(client: any) {
    if (client.handshake.headers.cookie) {
			let jwt = extractJwtFromCookie(client.handshake.headers.cookie);
      try {
        let payload = this.jwtService.verify(jwt);
        let usr: User = await getConnection()
          .getRepository(User)
          .createQueryBuilder('user')
          .where("id = :id", { id: payload.idUser})
          .getOneOrFail();
        if (this.removeUserFromQueue(payload.idUser)) {
          await this.usersService.setNotInGame(usr.name);
          return;
        }
        let idG = this.findGameByName(usr.name);
        if (this.games[idG].disconnect.username !== "") {
          this.usersService.setNotInGame(this.games[idG].players.p1.name);
          this.usersService.setNotInGame(this.games[idG].players.p2.name);
          this.games[idG].inUse = false;
          // console.error(this.games[idG].players.p1.name, " and ", this.games[idG].players.p2.name,  " are disconnected, end game.");
        }
        else {
          // console.error(usr.name, " quit the game.");
          this.games[idG].disconnect.username = usr.name;
          this.games[idG].disconnect.time = Date.now();
        }
      } catch (error) {}
		}
	}

  /*			Movements				*/

  @SubscribeMessage('keyDown')
  KeyDown(
  @MessageBody() data: any,
  @ConnectedSocket() client: Socket) {
    for (let i = 0; i < this.count; ++i) {
      if (this.games[i].players.p1.name === data.username) {
        if (data.direction === "up")
          this.games[i].players.p1.moves.up = true;
        if (data.direction === "down")
          this.games[i].players.p1.moves.down = true;
      } else if (this.games[i].players.p2.name === data.username) {
        if (data.direction === "up")
          this.games[i].players.p2.moves.up = true;
        if (data.direction === "down")
          this.games[i].players.p2.moves.down = true;
      }
    }
  }

  @SubscribeMessage("keyUp")
  KeyUp(
  @MessageBody() data: any,
  @ConnectedSocket() client: Socket) {
    for (let i = 0; i < this.count; ++i) {
      if (this.games[i].players.p1.name === data.username) {
        if (data.direction === "up")
          this.games[i].players.p1.moves.up = false;
        if (data.direction === "down")
          this.games[i].players.p1.moves.down = false;
      } else if (this.games[i].players.p2.name === data.username) {
        if (data.direction === "up")
          this.games[i].players.p2.moves.up = false;
          if (data.direction === "down")
          this.games[i].players.p2.moves.down = false;
      }
    }
  }

  /*			Game Mangement			*/

  createGame(lId: number, lName: string, lSocket: string, rId: number, rName: string, rSocket: string, rules: string, invitation: boolean) {
	let rule = this.disassembleRulesString(rules);
	for (let i = 0; i < this.count; ++i) {
		if (!this.games[i].inUse) {
      this.games[i].inUse = true;
			this.games[i].id = i;
			this.games[i].socketToEmit = new Array<string>;
			this.games[i].ball = this.matches.initBall(true);
			this.games[i].const = this.matches.initConst(rule.scoreMax, rule.map);
			this.games[i].disconnect = this.matches.initDisconnection();
			this.games[i].msg = this.matches.initMessage();
			this.games[i].powerUp = this.matches.initPowerUp(rule.powerUp);
			this.games[i].result = this.matches.initResults();
			this.games[i].players.p1 = this.matches.initPlayer(lId, lName, lSocket, 1);
			this.games[i].players.p2 = this.matches.initPlayer(rId, rName, rSocket, 2);
      // console.error("Start game with an existent one, id: ", i, "(", lName, ",", rName, ")");
      if (!invitation)
        this.gameLoop(this.games[i]);
			return;
		}
	}
  this.games[this.count] = {
    inUse: true,
    id: this.count,
    ball : this.matches.initBall(true),
    players: {
      p1: this.matches.initPlayer(lId, lName, lSocket, 1),
      p2: this.matches.initPlayer(rId, rName, rSocket, 2),
    },
    powerUp: this.matches.initPowerUp(rule.powerUp),
    result: this.matches.initResults(),
    const: this.matches.initConst(rule.scoreMax, rule.map),
    msg: this.matches.initMessage(),
    disconnect: this.matches.initDisconnection(),
    socketToEmit: new Array<string>,
  }
	++this.count;
  // console.error("New Game, id: ", this.count - 1, "(", lName, ",", rName, ")");
	if (!invitation)
    this.gameLoop(this.games[this.count - 1]);
  }

  gameLoop(game: Game) {
	this.sendToAllSockets(game, game.id);
  // console.error(game.players.p1.name, ", ", game.players.p2.name, " start playing.");
	let pid: NodeJS.Timer;
  let sendGame: boolean = false;
  /* For fps at the end of the game */ let cons: boolean = false; let total_ms: number = 0; let loop_count: number = 0; let ms: number = Date.now();
	pid = setInterval(async () => {
		total_ms += Date.now() - ms; ms = Date.now(); ++loop_count;
    this.matches.gameAlgo(game);
    if (game.inUse === false) {
      clearInterval(pid);
      console.error("Game close because not in use, id: ", game.id, "(", game.players.p1.name, ",", game.players.p2.name, ")");
      return;
    }
		if (game.disconnect.username !== "")
			this.matches.checkTimeoutDisconnectedUser(game);
		if (!sendGame && game.result.finished) {
			clearInterval(pid);
      sendGame = true;
			let toSend = new CreateMatchDto;
			toSend.player1 = game.players.p1.name;
			toSend.player2 = game.players.p2.name;
			toSend.winner = game.result.username;
			try {
				await this.matchesService.create(toSend);
			  } catch (error) {
				console.error(error);
			  }
			await this.sendEndGameToSockets(game.id);
			await this.usersService.checkUserAchievements(game.players.p1.name);
			await this.usersService.checkUserAchievements(game.players.p2.name);
			await this.usersService.setNotInGame(game.players.p1.name);
			await this.usersService.setNotInGame(game.players.p2.name);
			game.inUse = false;
      /* For fps at the end of the game */ if (!cons) {console.error("End Game: ", 1000 / (total_ms / loop_count), " fps."); cons = true;}
			return;
		}
		this.sendToAllSockets(game, game.id);
	}, 1000 / FPS)
  }
}
