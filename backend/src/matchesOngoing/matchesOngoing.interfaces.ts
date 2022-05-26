export interface GameMap {
	[gameId: number] : Game
}

export interface Game {
	inUse: boolean,
	id: number,
	ball: Ball,
	players: {
		p1: Player,
		p2: Player,
	},
	powerUp: PowerUp,
	result: Results,
	const: Const,
	msg: Message,
	disconnect: Disconnesction,
	socketToEmit: Array<string>,
}

export interface Ball {
	x: number,
	y: number,
	r: number,
	vX: number,
	vY: number,
}

export interface Player {
	id: number,
	name: string,
	socket: string,
	coord: Coord,
	moves: Mvts,
}

export interface Coord {
	x: number,
	y: number,
	h: number,
}


export interface Mvts {
    up: boolean;
    down: boolean;
}

export interface PowerUp {
	generate: boolean,
	Invisible: boolean,
	Shrink: boolean,
	State: boolean,
	x: number,
	y: number,
	l: number,
}

export interface Results {
	finished: boolean,
	username: string,
	scoreP1: number,
	scoreP2: number,
}

export interface Disconnesction {
	username: string,
	time: number,
}

export interface Const {
	width: number,
	height: number,
	backgroundColor: string,
	objectColor: string,
	scoreMax: number,
	palletWidth: number,

}
export interface Message {
	hasMessageToDisplay: boolean,
	messageToDisplay: string,
}

export interface IQueue {
        id: number,
		name: string,
        rules: string,
        socket: string,

}

export interface BoardPositions {
	palletAX: number;
  	palletAY: number;
	palletL: number;
	palletAHeight: number;
  	palletBX: number;
  	palletBY: number;
	palletBHeight: number;
	puckX: number;
  	puckY: number;
	puckVX: number;
	puckVY: number;
  	puckL: number;
	width: number;
	height: number;
}

export interface ListGame {
	idGame: number;
	playerOne: string;
	playerTwo: string;
}
