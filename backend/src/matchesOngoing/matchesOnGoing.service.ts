import { Game, Ball, Player, Coord, PowerUp } from "./matchesOngoing.interfaces"
import { Injectable } from "@nestjs/common";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  SPEED_PALLET,
  START_PALLET_HEIGHT,
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
  START_PUCK_R,
} from "./matchesOnGoing.constBoard";

class Point {
	x: number;
	y: number;

	constructor(x: number, y: number) {
	  this.x = x;
	  this.y = y;
	}
}

@Injectable()
export class MatchesOnGoingService {

	/*				Initilisation				*/

	initPlayer(idPlayer: number, username: string, socket: string, p: number) {
		return {
			id: idPlayer,
			name: username,
			socket: socket,
			coord: {
				x: p === 1 ? START_PALLETAX : START_PALLETBX,
				y: p === 1 ? START_PALLETAY : START_PALLETBY,
				h: START_PALLET_HEIGHT,
			},
			moves: {
				up: false,
				down: false,
			},
		};
	}

	initPallet(p: number) {
		return {
			x: p === 1 ? START_PALLETAX : START_PALLETBX,
			y: p === 1 ? START_PALLETBY : START_PALLETBY,
			h: START_PALLET_HEIGHT,
		}
	}

	initBall(side: boolean) {
		let pos = (Math.floor(Math.random() * 100) % 2) === 0 ? 1 : -1;
		return {
			x: START_PUCKX,
			y: START_PUCKY,
			r: START_PUCK_R,
			vX: side ? -START_PUCK_VEL : START_PUCK_VEL,
			vY: (Math.random() * 2 * pos),
		}
	}

	initPowerUp(use: boolean) {
		let p = Math.round((Math.random() * 100)) % 2;
		return {
			generate: use,
			Invisible: use && p === 0 ? true : false,
			Shrink: use && p === 0 ? false : true,
			State: true,
			x: Math.round(Math.random() * ((BOARD_WIDTH * 0.75) -  (BOARD_WIDTH * 0.25) + 1) + BOARD_WIDTH * 0.25),
			y: Math.round(Math.random() * ((BOARD_HEIGHT - POWERUP_HEIGHT) - 0 + 1)),
			l: POWERUP_WIDTH,
		}
	}

	initResults() {
		return { finished: false, username: "", scoreP1: 0, scoreP2: 0,}
	}

	initDisconnection() {
		return { username: "", time: 0,}
	}

	initMessage() {
		return { hasMessageToDisplay: false, messageToDisplay: "", }
	}

	initConstMap(score: number, background: string, object: string) {
		return {
			width: BOARD_WIDTH,
			height: BOARD_HEIGHT,
			backgroundColor: background,
			objectColor: object,
			scoreMax: score,
			palletWidth: START_PALLET_WIDTH,
		}
	}

	initConst(score: number, map: string) {
		if (map === "desert")
			return this.initConstMap(score, "#f9fb07", "#a51515");
		else if (map === "jungle")
			return this.initConstMap(score, "#0d3603", "#633204");
		else
			return this.initConstMap(score, "black", "white");
	}

	/*			Trajectory Calculation			*/

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

	/*			Collisions			*/

	checkCollisionPo(x: number, y: number, l: number, puck: Ball) {
		let collision: boolean = false;
		let aP = new Point(puck.x, puck.y);
		let nP = new Point(puck.x + puck.vX, puck.y + puck.vY);
		if ((puck.vX > 0 && puck.vY > 0) || (puck.vX <= 0 && puck.vY <= 0)) {	//  ↘ ↖
			let pSW = new Point(x, y + l);
			let pNE = new Point(x + l, y );
			collision = this.doIntersect(aP, nP, pSW, pNE);
		} else {	// ↗ ↙
			let pNW = new Point(x, y);
			let pSE = new Point(x + l, y + l);
			collision = this.doIntersect(aP, nP, pNW, pSE);
		}
		return collision;
	}

	checkCollisionPa(x1: number, y1: number, x2: number, y2: number, puck: Ball) {
		let collision: boolean = false;
		let aN = new Point(puck.x, puck.y - puck.r);
		let aS = new Point(puck.x, puck.y + puck.r);
		let nN = new Point(puck.x + puck.vX, puck.y + puck.vY - puck.r);
		let nS = new Point(puck.x + puck.vX, puck.y + puck.vY + puck.r);
		let p1 = new Point(x1, y1);
		let p2 = new Point(x2, y2);
		collision = this.doIntersect(aN, nN, p1, p2);
		if (!collision)
			collision = this.doIntersect(aS, nS, p1, p2);
		return collision;
	}

	checkCollisionPowerUp(powerUp: PowerUp, puck: Ball) {
		return this.checkCollisionPo(powerUp.x, powerUp.y, powerUp.l, puck);
	}

	checkCollisionPallet(player: Player, puck: Ball, w: number) {
		if (puck.vX > 0)
			return this.checkCollisionPa(player.coord.x, player.coord.y, player.coord.x, player.coord.y + player.coord.h, puck);
		else
			return this.checkCollisionPa(player.coord.x + w, player.coord.y, player.coord.x + w, player.coord.y + player.coord.h, puck);
	}

	/*			PowerUp			*/

	managementPowerUp(game: Game) {
		if (game.powerUp.generate && game.powerUp.State && this.checkCollisionPowerUp(game.powerUp, game.ball)) {
			game.powerUp.State = false;
			if (game.powerUp.Shrink)
				game.ball.vX > 0 ? game.players.p2.coord.h = SHRINKED_PALLET_HEIGHT : game.players.p1.coord.h = SHRINKED_PALLET_HEIGHT;
			else {
				game.ball.r = 0;
			}
		}
	}

	/*			GAME			*/

	roof(game: Game) {
		if (game.ball.y + game.ball.vY <= 0 || game.ball.y + game.ball.vY >= game.const.height) {
			// //console.error("ROOF");
			game.ball.y = game.ball.vY <= 0 ? 0 + game.ball.r  + 1 : game.const.height - game.ball.r - 1;
			game.ball.vY *= -1;
			return true;
		}
		return false
	}

	goal(game: Game) {
		if (game.ball.x + game.ball.vX <= 0 || game.ball.x + game.ball.vX >= game.const.width) {
			// //console.error("GOAL");
			game.ball.vX > 0 ? ++game.result.scoreP1 : ++game.result.scoreP2;
			if (game.result.scoreP1 === game.const.scoreMax || game.result.scoreP2 === game.const.scoreMax) {
				if (game.result.scoreP1 === game.const.scoreMax) {
					game.result.username = game.players.p1.name;
					game.msg.messageToDisplay = game.players.p1.name + " is the Winner!";
				} else {
					game.result.username = game.players.p2.name;
					game.msg.messageToDisplay = game.players.p2.name + " is the Winner!";
				}
				game.msg.hasMessageToDisplay = true;
				game.result.finished = true;
			} else {
				game.ball = this.initBall(game.ball.vX > 0 ? false : true);
				game.powerUp = this.initPowerUp(game.powerUp.generate);
				game.players.p1.coord = this.initPallet(1);
				game.players.p2.coord = this.initPallet(2);
			}
			return true;
		}
		return false;
	}
	/*			Pallet			*/
	collisionLeftPallet(pallet: Coord, puck: Ball)
	{
	//   //console.error("LEFT PALLET");
    let middlePallet = pallet.y + (pallet.h / 2);
	  let absPuckVX = Math.abs(puck.vX);
	  let restDistX = puck.x - puck.r - pallet.x - START_PALLET_WIDTH;                  // dist x remaining
	  let coefY = Math.round(restDistX * 100 / absPuckVX);                              // % dist y remaining
	  let restDistY = coefY * puck.vY / 100;
	  let impactAt = puck.y + (puck.r / 2) + (puck.vY > 0 ? restDistY : -restDistY);    // contact with pallet At
	  let distFromCenter = Math.abs(middlePallet - impactAt);                           // dist contact from center
	  let degree = (distFromCenter / (pallet.h / 2)) * START_MAX_VEL_Y;      			// % vel max
	  puck.vY = impactAt < middlePallet ? -degree : degree;                        		// new PuckVY
	  let restDistXAfterCollision = absPuckVX - restDistX;
	  puck.y += (restDistXAfterCollision * puck.vY) / absPuckVX;
	  puck.x += restDistXAfterCollision;
	  puck.vX = puck.vX * -1.1;
	  if (puck.r === 0)
	  	puck.r = START_PUCK_R;
	  return true;
	}

	collisionRightPallet(pallet: Coord, puck: Ball)
	{
	//   //console.error("RIGHT PALLET");
    let middlePallet = pallet.y + (pallet.h / 2);
	  let absPuckVX = Math.abs(puck.vX);
	  let restDistX = pallet.x - puck.x - puck.r;                                      // dist x remaining
	  let coefY = Math.round(restDistX * 100 / absPuckVX);                             // % dist y remaining
	  let restDistY = coefY * puck.vY / 100;
	  let impactAt = puck.y + (puck.r / 2) + (puck.vY > 0 ? restDistY : -restDistY);   // contact with pallet At
	  let distFromCenter = Math.abs(middlePallet - impactAt);                          // dist contact from center
	  let degree = (distFromCenter / (pallet.h / 2)) * START_MAX_VEL_Y;       		   // % vel max
	  puck.vY = impactAt < middlePallet ? -degree : degree;                  		   // new PuckVY
	  let restDistXAfterCollision = absPuckVX - restDistX;
	  puck.y += (restDistXAfterCollision * puck.vY) / absPuckVX;
		puck.x -= restDistXAfterCollision;
	  puck.vX = puck.vX * -1.1;
	  if (puck.r === 0)
		puck.r = START_PUCK_R;
	  return true;
	}

	collisionPallet(player: Player, ball: Ball) {
		if (this.checkCollisionPallet(player, ball, START_PALLET_WIDTH))
			return ball.vX > 0 ? this.collisionRightPallet(player.coord, ball) : this.collisionLeftPallet(player.coord, ball);
		if ((ball.vY > 0 && this.checkCollisionPa(player.coord.x, player.coord.y, player.coord.x + START_PALLET_WIDTH, player.coord.y, ball))
						 || this.checkCollisionPa(player.coord.x, player.coord.y + player.coord.h, player.coord.x + START_PALLET_WIDTH, player.coord.y + player.coord.h, ball))
			ball.vY *= -1;
		return false;
	}

	movePallets(p1: Player, p2: Player) {
		if (p1.moves.up && !p1.moves.down)
			p1.coord.y = p1.coord.y - SPEED_PALLET < 0 ? 0 : p1.coord.y - SPEED_PALLET;
		else if (!p1.moves.up && p1.moves.down)
			p1.coord.y = p1.coord.y + p1.coord.h + SPEED_PALLET > BOARD_HEIGHT ? BOARD_HEIGHT - p1.coord.h : p1.coord.y + SPEED_PALLET;
		if (p2.moves.up && !p2.moves.down)
			p2.coord.y = p2.coord.y - SPEED_PALLET < 0 ? 0 : p2.coord.y - SPEED_PALLET;
		else if (!p2.moves.up && p2.moves.down)
			p2.coord.y = p2.coord.y + p2.coord.h + SPEED_PALLET > BOARD_HEIGHT ? BOARD_HEIGHT - p2.coord.h : p2.coord.y + SPEED_PALLET;
	}

	gameAlgo(game: Game) {
		let stop: Boolean = true;
		if (game.result.finished || game.disconnect.username !== "")
			return;
		this.movePallets(game.players.p1, game.players.p2);
		this.managementPowerUp(game);
		stop = this.roof(game);
		if (!stop) stop = this.collisionPallet(game.ball.vX > 0 ? game.players.p2 : game.players.p1, game.ball);
		if (!stop) stop = this.goal(game);
		if (!stop) {
			game.ball.x += game.ball.vX;
			game.ball.y += game.ball.vY;
		}
		// this.pringGameState(game, "-- Algo --");
		return game;
	}

	checkTimeoutDisconnectedUser(game: Game) {
		let timeElapsed = Date.now() - game.disconnect.time;
		if (timeElapsed > 15000) {
			if (game.players.p1.name == game.disconnect.username)
				game.result.username = game.players.p2.name;
			else
				game.result.username = game.players.p1.name;
			game.result.finished = true;
			game.msg.hasMessageToDisplay = true;
			game.msg.messageToDisplay = game.result.username + " win!";
		}
		game.msg.hasMessageToDisplay = true;
		game.msg.messageToDisplay = game.disconnect.username + " is deconnected,  " + (15 - Math.round(timeElapsed / 1000)) + " remaining.";
	}

	pringGameState(game: Game, msg: string) {
		//console.error(msg);
		//console.error("Id: ", game.id);
		//console.error("Ball: x: ", game.ball.x, ", y: ",  game.ball.y, ", r: ", game.ball.r, ", vX: ", game.ball.vX, ", vY: ", game.ball.vY);
		//console.error("Points: p1: ", game.result.scoreP1, ",  p2: ", game.result.scoreP2);
		//console.error("Msg: has:", game.msg.hasMessageToDisplay, ", msg: " , game.msg.messageToDisplay);
		//console.error("--------------------------------------------------------------------------")
	}
}