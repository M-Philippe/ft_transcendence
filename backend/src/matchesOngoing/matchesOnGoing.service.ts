import { forwardRef, HttpException, HttpStatus, Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";
import { getConnection, Repository } from "typeorm";
import { MatchesOnGoing } from './entities/matchesOngoing.entity';
import { ListGame } from "./matchesOnGoing.types";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  SPEED_PALLET,
  START_PALLET_HEIGHT,
  START_PUCK_HEIGHT,
  START_PUCK_WIDTH,
  START_PUCK_VEL,
  START_PALLETAX,
  START_PALLETAY,
  START_PALLETBX,
  START_PALLETBY,
  START_PALLET_WIDTH,
  START_PUCKX,
  START_PUCKY,
  SHRINKED_PALLET_HEIGHT,
  START_MAX_VEL_Y,
  POWERUP_HEIGHT,
  POWERUP_WIDTH,
} from "./matchesOnGoing.constBoard";
import { Interface } from "readline";

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

interface Coord {
  puckX: number,
  puckY: number,
  puckVX: number,
  puckVY: number
};

function initStartingPositions(game: MatchesOnGoing) {
  game.width = BOARD_WIDTH;
  game.height = BOARD_HEIGHT;
  game.palletAX = START_PALLETAX;
  game.palletAY = START_PALLETAY;
  game.palletAWidth = START_PALLET_WIDTH;
  game.palletAHeight = START_PALLET_HEIGHT;
  game.palletAXFromUser = START_PALLETAX;
  game.palletAYFromUser = START_PALLETAY;
  game.palletBX = START_PALLETBX;
  game.palletBY = START_PALLETBY;
  game.palletBWidth = START_PALLET_WIDTH;
  game.palletBHeight = START_PALLET_HEIGHT;
  game.palletBXFromUser = START_PALLETBX;
  game.palletBYFromUser = START_PALLETBY;
  game.puckX = START_PUCKX;
  game.puckY = START_PUCKY;
  game.puckVX = START_PUCK_VEL;
  game.puckVY =  (Math.round(Math.random() * (100 - 1) + 1) * ((Math.random() * (100 -1) + 1) % 2 == 0 ? -1 : 1) / 100);
  game.puckHeight = START_PUCK_HEIGHT;
  game.puckWidth = START_PUCK_WIDTH;
  game.scorePlayerA = 0;
  game.scorePlayerB = 0;
  game.finishedGame = false;
  game.winnerUsername = "";
}

@Injectable()
export class MatchesOnGoingService {
  constructor(
    @InjectRepository(MatchesOnGoing)
    private matchesOnGoingRepository: Repository<MatchesOnGoing>,
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService
  ) {}

  async findAll() {
    return this.matchesOnGoingRepository.find();
  }

  async findOne(id: number) {
    const match = await this.matchesOnGoingRepository.findOne(id);
    if (match) {
      return match;
    }
    throw new HttpException({
      description: "No match corresponding."
    }, HttpStatus.NOT_FOUND);
  }

  async initStartingPositionsAfterScore(game: MatchesOnGoing, who: string) {
    let puckVX = who === "left" ? START_PUCK_VEL :  -START_PUCK_VEL;
    let puckVY = 0;
    await getConnection()
    .createQueryBuilder()
    .update(MatchesOnGoing)
    .set({
      palletAY: START_PALLETAY,
      palletBY: START_PALLETBY,
      palletAYFromUser: START_PALLETAY,
      palletBYFromUser: START_PALLETBY,
      palletAHeight: START_PALLET_HEIGHT,
      palletBHeight: START_PALLET_HEIGHT,
      puckX: START_PUCKX,
      puckY: START_PUCKY,
      scorePlayerA: game.scorePlayerA,
      scorePlayerB: game.scorePlayerB,
      puckVX: puckVX,
      puckVY: Math.round(Math.random() * (100 - 1) + 1) * ((Math.random() * (100 -1) + 1) % 2 == 0 ? -1 : 1) / 100,
      lastUpdateTime: Date.now()
    })
    .where("id = :id", { id: game.id })
    .execute();
  }

  async fetchListGame() {
    let games: MatchesOnGoing[] = [];
    let ret: ListGame[] = [];
    try {
      games = await this.matchesOnGoingRepository.find();
    } catch (error) {
      console.error(error);
      return undefined;
    }
    for (let i = 0; i < games.length; i++) {
      if (!games[i].pending) {
        ret.push({
          idGame: games[i].id,
          playerOne: games[i].players[0].username,
          playerTwo: games[i].players[1].username,
        });
      }
      console.error("FETCHING HERE");
    }
    return (ret);
  }

  async suscribeSpectator(idGame: number, socketToAdd: string) {
    let game: MatchesOnGoing | undefined;
    try {
      game = await this.matchesOnGoingRepository.findOne(idGame);
    } catch (error) {
      console.error(error);
      return;
    }
    if (game === undefined)
      return;
    game.socketsToEmit.push(socketToAdd);
    await getConnection()
          .createQueryBuilder()
          .update(MatchesOnGoing)
          .set({
            socketsToEmit: game.socketsToEmit,
          })
          .where("id = :id", { id: idGame })
          .execute();
  }

  async playerDisconnected(idGame: number, username: string) {
    let game: MatchesOnGoing | undefined;
    console.error("-> Player Disconnected <- " + Date.now());
    try {
      game = await this.matchesOnGoingRepository.findOne(idGame);
    } catch (error) {
      console.error(error);
      return;
    }
    if (game === undefined || game.players[0].username !== username && game.players[1].username !== username)
      return;

    // If pending game just delete it.
    if (game.pending) {
      await getConnection()
            .createQueryBuilder()
            .delete()
            .from(MatchesOnGoing)
            .where("id = :id", { id: idGame })
            .execute();
    }
    else {
      await getConnection()
            .createQueryBuilder()
            .update(MatchesOnGoing)
            .set({
              playerDisconnected: true,
              usernameDisconnectedPlayer: username,
              timeOfDisconnection: Date.now(),
            })
            .where("id = :id", { id: idGame })
            .execute();
    }
    return;
  }

  async checkTimeoutDisconnectedUser(game: MatchesOnGoing) {
    let timeElapsed = Date.now() - game.timeOfDisconnection;
    console.error("-> Check Timeout Disconnected User. Time elapsed: " + timeElapsed + ", time of disconnection: " +  game.timeOfDisconnection + ", date.now(): "+ Date.now() +") <-");
    if (timeElapsed > 30000) {
      if (game.usernameDisconnectedPlayer === game.players[0].username)
        game.winnerUsername = game.players[1].username;
      else
        game.winnerUsername = game.players[0].username;
      game.finishedGame = true;
      game.messageToDisplay = "Winner is " + game.winnerUsername + "!";
      await getConnection()
            .createQueryBuilder()
            .update(MatchesOnGoing)
            .set({
              hasMessageToDisplay: true,
              messageToDisplay: "Winner is " + game.winnerUsername + "!",
              finishedGame: true,
              winnerUsername: game.winnerUsername,
            })
            .execute();
    } else {
      await getConnection()
            .createQueryBuilder()
            .update(MatchesOnGoing)
            .set({
              hasMessageToDisplay: true,
              messageToDisplay: game.usernameDisconnectedPlayer + " is disconnected. " + (10 - Math.round(timeElapsed / 1000)) + " remaining.",
            })
            .where("id = :id", { id: game.id })
            .execute();
    }
    return (game);
  }

  async cancelMatch(username: string) {
    let game: MatchesOnGoing[] = [];
    try {
      game = await this.matchesOnGoingRepository.find()
    } catch (error) {
      console.error(error);
      return;
    }
    for (let i = 0; i < game.length; i++) {
      if (game[i].players[0].username === username && game[i].pending) {
        await getConnection()
              .createQueryBuilder()
              .delete()
              .from(MatchesOnGoing)
              .where("id = :id", { id: game[i].id})
              .execute();
      } else if (game[i].players[0].username === username && !game[i].pending)
        return;
    }
  }


  /*                                  Move Pallet                                 */

  // async movePalletPlayerB(board: MatchesOnGoing, direction: 0 | 1) {
  //   if (direction == 0 && board.palletBYFromUser <= 0)
  //     return (undefined);
  //   if (direction == 1 && board.palletBYFromUser + board.palletBHeight >= board.height)
  //     return (undefined);
  //   direction == 0 ?
  //     board.palletBYFromUser -= SPEED_PALLET:
  //     board.palletBYFromUser += SPEED_PALLET;
  //   await getConnection()
  //         .createQueryBuilder()
  //         .update(MatchesOnGoing)
  //         .set(
  //           {
  //             palletBYFromUser: board.palletBYFromUser,
  //           })
  //         .where("id = :id", { id: board.id})
  //         .execute();
  //   return (board);
  // }

  // async movePalletPlayerA(board: MatchesOnGoing, direction: 0 | 1) {
  //   if (direction == 0 && board.palletAYFromUser <= 0)
  //     return (undefined);
  //   if (direction == 1 && board.palletAYFromUser + board.palletAHeight >= board.height)
  //     return (undefined);
  //   direction == 0 ?
  //     board.palletAYFromUser -= SPEED_PALLET:
  //     board.palletAYFromUser += SPEED_PALLET;
  //   await getConnection()
  //         .createQueryBuilder()
  //         .update(MatchesOnGoing)
  //         .set(
  //           {
  //             palletAYFromUser: board.palletAYFromUser,
  //           })
  //         .where("id = :id", { id: board.id})
  //         .execute();
  //   return (board);
  // }

  // async movePalletPlayer(idGame: number, username: string, direction: "up" | "down") {
  //   let board;

  //   try {
  //     board = await this.findOne(idGame);
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  //   if (board.playerDisconnected)
  //     return;
  //   if (board.players[0].username === username)
  //     await this.movePalletPlayerA(board, direction === "up" ? 0 : 1);
  //   else if (board.players[1].username === username)
  //     await this.movePalletPlayerB(board, direction === "up" ? 0 : 1);
  //   else
  //     return;
  // }

  /*                                   Power Up                                  */

  onSegment(p: Point, q: Point, r: Point) {
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
      return true;
    return false;
  }

  orientation(p: Point, q: Point, r: Point) {
      let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (val == 0)                              // collinear
        return 0;
      return val > 0 ? 1 : 2;

  }

  doIntersect(p1: Point, q1: Point, p2: Point, q2: Point) {
      let o1 = this.orientation(p1, q1, p2);
      let o2 = this.orientation(p1, q1, q2);
      let o3 = this.orientation(p2, q2, p1);
      let o4 = this.orientation(p2, q2, q1);

      if (o1 != o2 && o3 != o4)                   // General Case
        return true;
      if (o1 == 0 && this.onSegment(p1, p2, q1))  // p2 on p1q1
        return true;
      if (o2 == 0 && this.onSegment(p1, q2, q1))  // q2 on p1q1
        return true;
      if (o3 == 0 && this.onSegment(p2, p1, q2))  // p1 on p2q2
        return true;
      if (o4 == 0 && this.onSegment(p2, q1, q2))  // q1 on p2q2
        return true;
      return false;
  }

  checkCollisionPowerUp(game: MatchesOnGoing, coord: Coord) {
    let collision: boolean = false;
    if ((coord.puckVX > 0 && coord.puckVY > 0) || (coord.puckVX <= 0 && coord.puckVY <= 0)) {
      let actualPuckLowerLeft = new Point(coord.puckX, (coord.puckY + game.puckHeight));
      let actualPuckTopRight = new Point((coord.puckX + game.puckWidth), coord.puckY);
      let nextPuckLowerLeft = new Point(coord.puckX + coord.puckVX, (coord.puckY + coord.puckVY + game.puckHeight));
      let nextPuckTopRight = new Point((coord.puckX + coord.puckVX + game.puckWidth), coord.puckY + coord.puckVY);
      let powerUpLowerLeft = new Point(game.powerUpX, (game.powerUpY + game.powerUpHeight));
      let powerUpTopRight = new Point((game.powerUpX + game.powerUpWidth), game.powerUpY);
      if (coord.puckVX > 0) {  //  ↘
        collision = this.doIntersect(actualPuckTopRight, nextPuckTopRight, powerUpLowerLeft, powerUpTopRight);
        if (!collision)
          collision = this.doIntersect(actualPuckLowerLeft, nextPuckLowerLeft, powerUpLowerLeft, powerUpTopRight);
      }
      else {                   // ↖
        collision = this.doIntersect(nextPuckTopRight, actualPuckTopRight, powerUpLowerLeft, powerUpTopRight);
        if (!collision)
          collision = this.doIntersect(nextPuckLowerLeft, actualPuckLowerLeft, powerUpLowerLeft, powerUpTopRight);
      }
    }
    else {
      let actualPuckTopLeft = new Point(coord.puckX, coord.puckY);
      let actualPuckLowerRight = new Point((coord.puckX + game.puckWidth), (coord.puckY + game.puckHeight));
      let nextPuckTopLeft = new Point(coord.puckX + coord.puckVX, coord.puckY + coord.puckVY);
      let nextPuckLowerRight = new Point((coord.puckX + coord.puckVX + game.puckWidth), (coord.puckY + coord.puckVY + game.puckHeight));
      let powerUpTopLeft = new Point(game.powerUpX, game.powerUpY);
      let powerUpLowerRight = new Point((game.powerUpX + game.powerUpWidth), (game.powerUpY + game.powerUpHeight));
      if (coord.puckVX > 0) {  // ↗
        collision = this.doIntersect(actualPuckTopLeft, nextPuckTopLeft, powerUpTopLeft, powerUpLowerRight);
        if (!collision)
          collision = this.doIntersect(actualPuckLowerRight, nextPuckLowerRight, powerUpTopLeft, powerUpLowerRight);
      }
      else {                   // ↙
        collision = this.doIntersect(nextPuckTopLeft, actualPuckTopLeft, powerUpTopLeft, powerUpLowerRight);
        if (!collision)
          collision = this.doIntersect(nextPuckLowerRight, actualPuckLowerRight, powerUpTopLeft, powerUpLowerRight);
      }
    }
    return collision;
  }

  async powerUpCollisions(game: MatchesOnGoing, coord: Coord) {
    if (this.checkCollisionPowerUp(game, coord)) {
      game.powerUpState = 1;
      if (game.powerUpShrink)
        coord.puckVX < 0 ? game.palletAHeight = SHRINKED_PALLET_HEIGHT : game.palletBHeight = SHRINKED_PALLET_HEIGHT;
      await getConnection()
            .createQueryBuilder()
            .update(MatchesOnGoing)
            .set({
              palletAHeight: game.palletAHeight,
              palletBHeight: game.palletBHeight,
              powerUpState: game.powerUpState
            })
            .where("id = :id", {id: game.id})
            .execute();
    }
  }

  async removePowerUp(game: MatchesOnGoing, collision: boolean) {
    game.powerUpState = 2;
    await getConnection()
      .createQueryBuilder()
      .update(MatchesOnGoing)
      .set({ powerUpState: game.powerUpState })
      .where("id = :id", {id: game.id})
      .execute();
  }

  /*                                  Collisions                                 */

  roof(game: MatchesOnGoing, coord: Coord) {
    coord.puckY = coord.puckVY <= 0 ? Math.abs(coord.puckVY) - coord.puckY : (game.height * 2) - coord.puckVY - coord.puckY;
    coord.puckVY *= -1;
  }

  async goal(game: MatchesOnGoing, who: string) {
    who == "left" ? game.scorePlayerA += 1 : game.scorePlayerB += 1;
    if (game.scorePlayerA == game.scoreMax || game.scorePlayerB == game.scoreMax) {
      game.finishedGame = true;
      game.winnerUsername = who == "left" ? game.players[0].username : game.players[1].username;
      game.hasMessageToDisplay = true;
      game.messageToDisplay = who == "left" ? game.players[0].username : game.players[1].username;
      game.messageToDisplay += " win, good job !";
      await this.matchesOnGoingRepository.update(game.id, game);
    }
    else {
      await this.initStartingPositionsAfterScore(game, who);
      if (game.generatePowerUp) {
        this.setPowerUp(game);
        await getConnection()
              .createQueryBuilder()
              .update(MatchesOnGoing)
              .set({
                powerUpX: game.powerUpX,
                powerUpY: game.powerUpY,
                powerUpInvisible: game.powerUpInvisible,
                powerUpShrink: game.powerUpShrink,
                powerUpState: game.powerUpState
              })
              .where("id = :id", {id: game.id})
              .execute();
      }
    }
  }

  collisionLeftPallet(game: MatchesOnGoing, coord: Coord)
  {
    let middlePallet = game.palletAHeight;
    middlePallet = middlePallet / 2 + game.palletAY;
    let absPuckVX = Math.abs(coord.puckVX);
    let restDistX = coord.puckX - game.palletAX - game.palletAWidth;                  // dist x remaining
    let coefY = Math.round(restDistX * 100 / absPuckVX);                              // % dist y remaining
    let restDistY = coefY * coord.puckVY / 100;
    let impactAt = coord.puckY + (game.puckHeight / 2);
    impactAt += coord.puckVY > 0 ? restDistY : -restDistY;                            // contact with pallet At
    let distFromCenter = Math.abs(middlePallet - impactAt);                           // dist contact from center
    let degree = (distFromCenter / (game.palletAHeight / 2)) * START_MAX_VEL_Y;       // % vel max
    coord.puckVY = impactAt < middlePallet ? -degree : degree;                        // new PuckVY
    let restDistXAfterCollision = absPuckVX - restDistX;
    coord.puckY += (restDistXAfterCollision * coord.puckVY) / absPuckVX;
    coord.puckX += restDistXAfterCollision;
    coord.puckVX = coord.puckVX * -1.1;
    return true;
  }

  collisionRightPallet(game: MatchesOnGoing, coord: Coord)
  {
    let middlePallet = game.palletBHeight;
    middlePallet = middlePallet / 2 + game.palletBY;
    let absPuckVX = Math.abs(coord.puckVX);
    let restDistX = game.palletBX - coord.puckX;                                      // dist x remaining
    let coefY = Math.round(restDistX * 100 / absPuckVX);                              // % dist y remaining
    let restDistY = coefY * coord.puckVY / 100;
    let impactAt = coord.puckY + (game.puckHeight / 2);
    impactAt += coord.puckVY > 0 ? restDistY : -restDistY;                            // contact with pallet At
    let distFromCenter = Math.abs(middlePallet - impactAt);                           // dist contact from center
    let degree = (distFromCenter / (game.palletBHeight / 2)) * START_MAX_VEL_Y;       // % vel max
    coord.puckVY = impactAt < middlePallet ? -degree : degree;                        // new PuckVY
    let restDistXAfterCollision = absPuckVX - restDistX;
    coord.puckY += (restDistXAfterCollision * coord.puckVY) / absPuckVX;
    coord.puckX -= restDistXAfterCollision;
    coord.puckVX = coord.puckVX * -1.1;
    return true;
  }
  /*                                  Move Puck                                 */

  async movePuck(gameId: number, p1: any, p2: any) {
    let game: MatchesOnGoing = await getConnection()
        .getRepository(MatchesOnGoing)
        .createQueryBuilder('matches')
        .where("id = :id", { id: gameId})
        .getOneOrFail();
    if (p1 === undefined || p2 == undefined) {
      console.error("player undefined");
      return undefined;
    }
    if (game.finishedGame)
      return  undefined;
    if (p1.disconnect || p2.disconnect)
      this.checkTimeoutDisconnectedUser(game);

    let collisionPallet: boolean = false;
    let coord: Coord = {puckX: Number(game.puckX), puckY: Number(game.puckY), puckVX: Number(game.puckVX), puckVY:  Number(game.puckVY)};
    game.palletAY += (p1.move * SPEED_PALLET);
    if (game.palletAY + game.palletAHeight > BOARD_HEIGHT)
      game.palletAY = BOARD_HEIGHT - game.palletAHeight;
    else if (game.palletAY < 0)
      game.palletAY = 0;
    game.palletBY += (p2.move * SPEED_PALLET);
    if (game.palletBY + game.palletBHeight > BOARD_HEIGHT)
      game.palletBY = BOARD_HEIGHT - game.palletBHeight;
    else if (game.palletBY < 0)
      game.palletBY = 0;

    // console.error("\n--> PuckX = ", coord.puckX, " and puckVX = ", coord.puckVX, ", puckY = ", coord.puckY, ", puckVY = ", coord.puckVY,);
    if (coord.puckX + coord.puckVX <= 0.0 || coord.puckX + coord.puckVX >= game.width)
      await this.goal(game, coord.puckX < game.width / 2 ? "right" : "left");
    else {
      if (game.powerUpState == 0)
        this.powerUpCollisions(game, coord);
      if (coord.puckY + coord.puckVY <= 0.0 || coord.puckY + coord.puckVY >= game.height)
        this.roof(game, coord);
      else if (coord.puckX + coord.puckVX <= (game.palletAX + game.palletAWidth) && coord.puckY >= game.palletAY - game.puckHeight && coord.puckY <= game.palletAY + game.palletAHeight)
        collisionPallet = this.collisionLeftPallet(game, coord);
      else if (coord.puckX + coord.puckVX >= game.palletBX && coord.puckY >= game.palletBY - game.puckHeight && coord.puckY <= game.palletBY + game.palletBHeight)
        collisionPallet = this.collisionRightPallet(game, coord);
      else {
        coord.puckX += coord.puckVX;
        coord.puckY += coord.puckVY;
      }
      if (game.powerUpState == 1 && game.powerUpInvisible && collisionPallet)
        this.removePowerUp(game, collisionPallet);

      await getConnection()
          .createQueryBuilder()
          .update(MatchesOnGoing)
          .set({
            puckX: Math.round(coord.puckX * 100) / 100,
            puckY: Math.round(coord.puckY * 100) / 100,
            puckVX: Math.round(coord.puckVX * 100) / 100,
            puckVY: Math.round(coord.puckVY * 100) / 100,
            palletAY: game.palletAY,
            palletBY: game.palletBY,
            lastUpdateTime: Date.now(),
          })
          .where("id = :id", {id: game.id})
          .execute();
          // p1.move = 0;
          // p2.move = 0;
    }
    return (game);
  }

  setColorMap(match: MatchesOnGoing, map: string) {
    if (map === "original") {
      match.bakckgroundColor = "black";
      match.objectColor = "white";
    } else if (map === "desert") {
      match.bakckgroundColor = "#f9fb07";
      match.objectColor = "#a51515";
    } else if (map === "jungle") {
      match.bakckgroundColor = "#0d3603";
      match.objectColor = "#633204";
    } else {
      match.bakckgroundColor = "black";
      match.objectColor = "white";
    }
  }

  setPowerUp(match: MatchesOnGoing) {
    match.powerUpState = 0;
    match.powerUpInvisible = false;
    match.powerUpShrink = false;
    if (Math.round((Math.random() * (100 - 1) + 1)) % 2 == 0)
      match.powerUpShrink = true;
    else
      match.powerUpInvisible = true;
    match.powerUpHeight = POWERUP_HEIGHT;
    match.powerUpWidth = POWERUP_WIDTH;
    match.powerUpX = Math.round(Math.random() * ((BOARD_WIDTH * 0.75) -  (BOARD_WIDTH * 0.25) + 1) + BOARD_WIDTH * 0.25);
    match.powerUpY = Math.round(Math.random() * ((BOARD_HEIGHT - POWERUP_HEIGHT) - 0 + 1));
  }

  setPowerUpToNull(match: MatchesOnGoing) {
    match.powerUpState = -1;
    match.powerUpInvisible = false;
    match.powerUpShrink = false;
    match.powerUpHeight = 0;
    match.powerUpWidth = 0;
    match.powerUpX = 0;
    match.powerUpY = 0;
  }

  async createMatchFromInvitation(playerOne: User, playerTwo: User, rules: any) {
    let match;
    try {
      match = this.matchesOnGoingRepository.create();
    } catch (error) {
      throw new Error(error);
    }
    initStartingPositions(match);
    match.pending = false;
    match.players = [];
    match.players.push({
      username: playerOne.name,
      palletAssigned: 0,
      socket: "",
    });
    match.players.push({
      username: playerTwo.name,
      palletAssigned: 1,
      socket: "",
    })
    match.socketsToEmit = [];
    match.scoreMax = rules.scoreMax;
    this.setColorMap(match, rules.map);
    match.generatePowerUp = rules.powerUp;
    if (match.generatePowerUp)
      this.setPowerUp(match);
    else
      this.setPowerUpToNull(match);
    const d = new Date();
    match.startTime = d.valueOf();
    match.lastUpdateTime = d.valueOf();
    match.hasMessageToDisplay = false;
    match.messageToDisplay = "";
    match.playerDisconnected = false;
    match.usernameDisconnectedPlayer = "";
    match.timeOfDisconnection = 0;
    match.finishedGame = false;
    try {
      await this.matchesOnGoingRepository.save(match);
    } catch (error) {
      throw new Error(error);
    }
  }

  async createMatchFromGateway(rules: any, socket: string) {
    let match;
    try {
      match = this.matchesOnGoingRepository.create();
    } catch (error) {
      throw new Error(error);
    }
    initStartingPositions(match);
    match.pending = true;
    match.players = [];
    match.players.push({
      username: rules.username,
      palletAssigned: 0,
      socket: socket,
    });
    match.socketsToEmit = [socket];
    match.scoreMax = rules.scoreMax;
    this.setColorMap(match, rules.map);
    match.generatePowerUp = rules.powerUp;
    if (match.generatePowerUp)
      this.setPowerUp(match);
    else
      this.setPowerUpToNull(match);
    const d = new Date();
    match.startTime = d.valueOf();
    match.lastUpdateTime = d.valueOf();
    match.hasMessageToDisplay = false;
    match.messageToDisplay = "";
    match.playerDisconnected = false;
    match.usernameDisconnectedPlayer = "";
    match.timeOfDisconnection = 0;
    try {
      await this.matchesOnGoingRepository.save(match);
    } catch (error) {
      throw new Error(error);
    }
    return (match);
  }

  async addPlayerInPendingGame(match: MatchesOnGoing, username: string, socket: string) {
    match.players.push({
      username: username,
      palletAssigned: 1,
      socket: socket,
    });
    match.pending = false;
    try {
      await this.matchesOnGoingRepository.save(match);
    } catch (error) {
      return undefined;
    }
    return (match);
  }

  async checkSimilarGamePending(rules: any, socket: string) {
    let allGames: MatchesOnGoing[];
    try {
      allGames = await this.findAll();
    } catch (error) {
      return (undefined);
    }
    console.log(allGames.length);
    for (let i = 0; i < allGames.length; i++) {
      if (!allGames[i].pending)
        break;
      if (allGames[i].pending && allGames[i].players !== rules.username
      && allGames[i].scoreMax == rules.scoreMax
      && allGames[i].generatePowerUp == rules.powerUp)
        return (await this.addPlayerInPendingGame(allGames[i], rules.username, socket));
    }
    return (undefined);
  }

  async deleteFromGateway(game: MatchesOnGoing) {
    await getConnection()
          .createQueryBuilder()
          .delete()
          .from(MatchesOnGoing)
          .where("id = :id", { id: game.id})
          .execute();
  }

  async deleteGame(gameId: number) {
    await getConnection()
          .createQueryBuilder()
          .delete()
          .from(MatchesOnGoing)
          .where("id = :id", { id: gameId})
          .execute();
  }

  async updateSocketPlayers(game: MatchesOnGoing, socket: string, playerIndex: 0 | 1) {
    game.players[playerIndex].socket = socket;
    game.hasMessageToDisplay = false;
    game.playerDisconnected = false;
    game.usernameDisconnectedPlayer = "";
    await getConnection()
          .createQueryBuilder()
          .update(MatchesOnGoing)
          .set({
            players: game.players,
            hasMessageToDisplay: false,
            playerDisconnected: false,
            usernameDisconnectedPlayer: "",
          })
          .where("id = :id", { id: game.id})
          .execute();
      return (game);
    }

  async checkUserAlreadyInGame(username: string, socket: string) {
    let allGames: MatchesOnGoing[];
    try {
      allGames = await this.findAll();
    } catch (error) {
      return (undefined);
    }
    for (let i = 0; i < allGames.length; i++) {
      if (allGames[i].players[0].username === username)
        return (await this.updateSocketPlayers(allGames[i], socket, 0));
      else if (allGames[i].players.length != 1 && allGames[i].players[1].username === username)
        return (await this.updateSocketPlayers(allGames[i], socket, 1));
    }
    return (undefined);
  }

  async updatePlayerInvitationGame(idUser: number, socket: string) {
    let user;
    try {
      user = await this.usersService.findOne(idUser);
    } catch (error) {
      console.error("ERROR [UPDATE_PLAYER_INVITATION_GAME]: ", error);
      return (undefined);
    }
    let games = await this.findAll();
    for (let i = 0; i < games.length; i++) {
      if (games[i].pending || games[i].finishedGame)
        continue;
      if (games[i].players[0].username === user.name) {
        let tmp = games[i].players;
        tmp[0].socket = socket;
        await this.matchesOnGoingRepository.update(games[i].id, {...games[i], players: tmp});
        if (games[i].players[1].socket === "") {
          return (games[i].id);
        } else
          return (games[i]);
      } else if (games[i].players[1].username === user.name) {
        let tmp = games[i].players;
        tmp[1].socket = socket;
        await this.matchesOnGoingRepository.update(games[i].id, {...games[i], players: tmp});
        if (games[i].players[0].socket === "") {
          return (games[i].id);
        } else
          return (games[i]);
      }
    }
  }
}
