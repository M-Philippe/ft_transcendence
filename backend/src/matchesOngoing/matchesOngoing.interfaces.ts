export interface MvtsMap {
    [gameId: string]: Mvts;
}

export interface Mvts {
        move: [
            {
                up: boolean;
                down: boolean;
            },
        ]
}
      
export interface IQueue {
        id: number,
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
