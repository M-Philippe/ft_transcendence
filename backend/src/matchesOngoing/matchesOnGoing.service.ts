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
  game.palletL = START_PALLET_WIDTH;
  game.width = BOARD_WIDTH;
  game.height = BOARD_HEIGHT;
  game.palletAX = START_PALLETAX;
  game.palletAY = START_PALLETAY;
  game.palletAHeight = START_PALLET_HEIGHT;
  game.palletAXFromUser = START_PALLETAX;
  game.palletayfromuser = 0;
  game.palletBX = START_PALLETBX;
  game.palletBY = START_PALLETBY;
  game.palletBHeight = START_PALLET_HEIGHT;
  game.palletBXFromUser = START_PALLETBX;
  game.palletbyfromuser = 0;
  game.puckX = START_PUCKX;
  game.puckY = START_PUCKY;
  game.puckVX = START_PUCK_VEL;
  game.puckVY =  (Math.round(Math.random() * (100 - 1) + 1) * ((Math.random() * (100 -1) + 1) % 2 == 0 ? -1 : 1) / 100);
  game.puckL = START_PUCK_HEIGHT;
  game.p1 = "";
  game.p2 = "";
  game.scorePlayerA = 0;
  game.scorePlayerB = 0;
  game.finishedGame = false;
  game.winnerUsername = "";
  game.lastUpdateTime = Date.now();
  game.hasMessageToDisplay = false;
  game.messageToDisplay = "";
  game.playerDisconnected = false;
  game.usernameDisconnectedPlayer = "";
  game.timeOfDisconnection = 0;
  game.pending = false;
  game.players = [];
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

  async findOneWithUser(username: string) {
    let game;
    try {
      game = await getConnection()
        .getRepository(MatchesOnGoing)
        .createQueryBuilder("game")
        .where("p1 = :name1", { name1: username })
        .orWhere("p2 = :name2", { name2: username })
        .getOneOrFail();
    } catch (error) {
      return undefined;
    }
    return game;
  }

  async initStartingPositionsAfterScore(game: MatchesOnGoing, who: string) {
    let puckVX = who === "left" ? START_PUCK_VEL :  -START_PUCK_VEL;
    await getConnection()
    .createQueryBuilder()
    .update(MatchesOnGoing)
    .set({
      palletAY: START_PALLETAY,
      palletBY: START_PALLETBY,
      palletayfromuser: 0,
      palletbyfromuser: 0,
      palletAHeight: START_PALLET_HEIGHT,
      palletBHeight: START_PALLET_HEIGHT,
      puckX: START_PUCKX,
      puckY: START_PUCKY,
      scorePlayerA: game.scorePlayerA,
      scorePlayerB: game.scorePlayerB,
      puckVX: puckVX,
      puckVY: Math.round(Math.random() * (100 - 1) + 1) * ((Math.random() * (100 -1) + 1) % 2 == 0 ? -1 : 1) / 100,
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
      ret.push({
        idGame: games[i].id,
        playerOne: games[i].players[0].username,
        playerTwo: games[i].players[1].username,
      });
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
    if (timeElapsed > 15000) {
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
              messageToDisplay: game.usernameDisconnectedPlayer + " is disconnected, " + (15 - Math.round(timeElapsed / 1000)) + " remaining.",
            })
            .where("id = :id", { id: game.id })
            .execute();
    }
    return (game);
  }

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
      let actualPuckLowerLeft = new Point(coord.puckX, (coord.puckY + game.puckL));
      let actualPuckTopRight = new Point((coord.puckX + game.puckL), coord.puckY);
      let nextPuckLowerLeft = new Point(coord.puckX + coord.puckVX, (coord.puckY + coord.puckVY + game.puckL));
      let nextPuckTopRight = new Point((coord.puckX + coord.puckVX + game.puckL), coord.puckY + coord.puckVY);
      let powerUpLowerLeft = new Point(game.powerUpX, (game.powerUpY + game.powerUpL));
      let powerUpTopRight = new Point((game.powerUpX + game.powerUpL), game.powerUpY);
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
      let actualPuckLowerRight = new Point((coord.puckX + game.puckL), (coord.puckY + game.puckL));
      let nextPuckTopLeft = new Point(coord.puckX + coord.puckVX, coord.puckY + coord.puckVY);
      let nextPuckLowerRight = new Point((coord.puckX + coord.puckVX + game.puckL), (coord.puckY + coord.puckVY + game.puckL));
      let powerUpTopLeft = new Point(game.powerUpX, game.powerUpY);
      let powerUpLowerRight = new Point((game.powerUpX + game.powerUpL), (game.powerUpY + game.powerUpL));
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

  // collisionLeftPallet(game: MatchesOnGoing, coord: Coord)
  // {
  //   const middlePallet = game.palletAHeight / 2 + game.palletAY;
  //   const absPuckVX = Math.abs(coord.puckVX);
  //   const restDistX = coord.puckX - game.palletAX - game.palletL;                  // dist x remaining
  //   const coefY = restDistX * 100 / absPuckVX;                              // % dist y remaining
  //   const restDistY = coefY * coord.puckVY / 100;
  //   const impactAt = coord.puckY + (game.puckL / 2) + coord.puckVY > 0 ? restDistY : -restDistY;                            // contact with pallet At
  //   const distFromCenter = Math.abs(middlePallet - impactAt);                           // dist contact from center
  //   const degree = (distFromCenter / (game.palletAHeight / 2)) * START_MAX_VEL_Y;       // % vel max
  //   coord.puckVY = impactAt < middlePallet ? -degree : degree;                        // new PuckVY
  //   const restDistXAfterCollision = absPuckVX - restDistX;
  //   coord.puckY += (restDistXAfterCollision * coord.puckVY) / absPuckVX;
  //   coord.puckX += restDistXAfterCollision;
  //   coord.puckVX = coord.puckVX * -1.1;
  //   return true;
  // }

  // collisionRightPallet(game: MatchesOnGoing, coord: Coord)
  // {
  //   const middlePallet = game.palletBHeight / 2 + game.palletBY;
  //   const absPuckVX = Math.abs(coord.puckVX);
  //   const restDistX = game.palletBX - coord.puckX;                                      // dist x remaining
  //   const coefY = restDistX * 100 / absPuckVX;                              // % dist y remaining
  //   const restDistY = coefY * coord.puckVY / 100;
  //   const impactAt = coord.puckY + (game.puckL / 2) + coord.puckVY > 0 ? restDistY : -restDistY;                            // contact with pallet At
  //   const distFromCenter = Math.abs(middlePallet - impactAt);                           // dist contact from center
  //   const degree = (distFromCenter / (game.palletBHeight / 2)) * START_MAX_VEL_Y;       // % vel max
  //   coord.puckVY = impactAt < middlePallet ? -degree : degree;                        // new PuckVY
  //   const restDistXAfterCollision = absPuckVX - restDistX;
  //   coord.puckY += (restDistXAfterCollision * coord.puckVY) / absPuckVX;
  //   coord.puckX -= restDistXAfterCollision;
  //   coord.puckVX = coord.puckVX * -1.1;
  //   return true;
  // }

  collisionLeftPallet(game: MatchesOnGoing, coord: Coord)
  {
    let middlePallet = game.palletAHeight;
    middlePallet = middlePallet / 2 + game.palletAY;
    let absPuckVX = Math.abs(coord.puckVX);
    let restDistX = coord.puckX - game.palletAX - game.palletL;                  // dist x remaining
    let coefY = Math.round(restDistX * 100 / absPuckVX);                              // % dist y remaining
    let restDistY = coefY * coord.puckVY / 100;
    let impactAt = coord.puckY + (game.puckL / 2);
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
    let impactAt = coord.puckY + (game.puckL / 2);
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

  // async movePuck(gameId: number, move1: number = 0, move2: number = 0) {
    async movePuck(gameId: number, move1: number, move2: number) {
    let game: MatchesOnGoing
    try {
      game = await getConnection()
        .getRepository(MatchesOnGoing)
        .createQueryBuilder('matches')
        .where("id = :id", { id: gameId})
        .getOneOrFail();
    } catch (error) {
      return null;
    }

    if (game.finishedGame)
      return  undefined;
    if (game.playerDisconnected)
      return game;
    let collisionPallet: boolean = false;
    let coord: Coord = {puckX: Number(game.puckX), puckY: Number(game.puckY), puckVX: Number(game.puckVX), puckVY:  Number(game.puckVY)};
   
    game.palletAY += move1;
    if (game.palletAY + game.palletAHeight > BOARD_HEIGHT)
      game.palletAY = BOARD_HEIGHT - game.palletAHeight;
    else if (game.palletAY < 0)
      game.palletAY = 0;
    game.palletBY += move2;    
    if (game.palletBY + game.palletBHeight > BOARD_HEIGHT)
      game.palletBY = BOARD_HEIGHT - game.palletBHeight;
    else if (game.palletBY < 0)
      game.palletBY = 0;

    if (coord.puckX + coord.puckVX <= 0.0 || coord.puckX + coord.puckVX >= game.width)
      await this.goal(game, coord.puckX < game.width / 2 ? "right" : "left");
    else {
      if (game.powerUpState == 0)
        this.powerUpCollisions(game, coord);
      if (coord.puckY + coord.puckVY <= 0.0 || coord.puckY + coord.puckVY >= game.height)
        this.roof(game, coord);
      else if (coord.puckX + coord.puckVX <= (game.palletAX + game.palletL) && coord.puckY >= game.palletAY - game.puckL && coord.puckY <= game.palletAY + game.palletAHeight)
        collisionPallet = this.collisionLeftPallet(game, coord);
      else if (coord.puckX + coord.puckVX >= game.palletBX && coord.puckY >= game.palletBY - game.puckL && coord.puckY <= game.palletBY + game.palletBHeight)
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
            puckX: coord.puckX,
            puckY: coord.puckY,
            puckVX: coord.puckVX,
            puckVY: coord.puckVY,
            palletAY: game.palletAY,
            palletBY: game.palletBY,
          })
          .where("id = :id", {id: game.id})
          .execute();
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
    match.powerUpL = POWERUP_HEIGHT;
    match.powerUpX = Math.round(Math.random() * ((BOARD_WIDTH * 0.75) -  (BOARD_WIDTH * 0.25) + 1) + BOARD_WIDTH * 0.25);
    match.powerUpY = Math.round(Math.random() * ((BOARD_HEIGHT - POWERUP_HEIGHT) - 0 + 1));
  }

  setPowerUpToNull(match: MatchesOnGoing) {
    match.powerUpState = -1;
    match.powerUpInvisible = false;
    match.powerUpShrink = false;
    match.powerUpL = 0;
    match.powerUpX = 0;
    match.powerUpY = 0;
  }

  /*
  **  VROTH_DI
  */
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
    match.p1 = playerOne.name;
    match.p2 = playerTwo.name;
    match.socketsToEmit = [];
    match.scoreMax = rules.scoreMax;
    this.setColorMap(match, rules.map);
    match.generatePowerUp = rules.powerUp;
    if (match.generatePowerUp)
      this.setPowerUp(match);
    else
      this.setPowerUpToNull(match);
    match.lastUpdateTime = Date.now();
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

  async createMatchFromGateway(idPlayerOne: number, idPlayerTwo: number, rules: any, socketUserOne: string, socketUserTwo: string) {
    let match;
    let userOne: User;
    let userTwo: User;
    try {
      userOne = await this.usersService.findOne(idPlayerOne);
      userTwo = await this.usersService.findOne(idPlayerTwo);
      match = this.matchesOnGoingRepository.create();
    } catch (error) { return undefined; }

    initStartingPositions(match);
    match.players.push({
      username: userOne.name,
      palletAssigned: 0,
      socket: socketUserOne,
    });
    match.players.push({
      username: userTwo.name,
      palletAssigned: 1,
      socket: socketUserTwo,
    });
    match.p1 = userOne.name;
    match.p2 = userTwo.name;
    match.socketsToEmit = [];
    match.scoreMax = rules.scoreMax;
    this.setColorMap(match, rules.map);
    match.generatePowerUp = rules.powerUp;
    if (match.generatePowerUp)
      this.setPowerUp(match);
    else
      this.setPowerUpToNull(match);
    try {
      await this.matchesOnGoingRepository.save(match);
    } catch (error) {
      return undefined;
    }
    return (match);
  }

  async addPlayerInPendingGame(match: MatchesOnGoing, username: string, socket: string) {
    match.players.push({
      username: username,
      palletAssigned: 1,
      socket: socket,
    });
    match.p2 = username;
    match.pending = false;
    try {
      await this.matchesOnGoingRepository.save(match);
    } catch (error) {
      return undefined;
    }
    return (match);
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

  async updateSocketPlayers(game: MatchesOnGoing, socket: string, playerIndex: number) {
    console.error("IN_GAME_PASSED: ", playerIndex);
    game.players[playerIndex - 1].socket = socket;
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
            messageToDisplay: "",
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
