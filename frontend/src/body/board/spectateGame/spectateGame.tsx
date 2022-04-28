import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { useCanvas } from "../boardHooks";

interface SpectateGameProps {
	socket: Socket;
}

interface ListGame {
	idGame: number;
	playerOne: string;
	playerTwo: string;
}

export default function SpectateGame(props: SpectateGameProps) {
	const [coordinates, setCoordinates, canvasRef] = useCanvas();
	const [listGame, setListGame] = useState<ListGame[]>([]);
	const [firstRender, setFirstRender] = useState(true);

	useEffect(() => {
		setFirstRender(false);
	}, []);

	if (firstRender)
		props.socket.emit("fetchListGame");

	props.socket.off("receivedListGame");
	props.socket.on("receivedListGame", (...args: any) => {
		let tmp: ListGame[] = [];
		for (let i = 0; i < args[0].listGame.length; i++)
			tmp.push(args[0].listGame[i]);
		setListGame(tmp);
	});

	props.socket.off("updatePositions");
	props.socket.on("updatePositions", (...args: any) => {
		setCoordinates(args[0].positions);
	});

	if (coordinates.height !== 0)
		return(
			<div>
				<canvas
					ref={canvasRef}
					id="board"
					width={coordinates.width}
					height={coordinates.height}
					tabIndex={0}
				>
				</canvas>
			</div>
		);

	// ListGame & refreshButton
	return (
		<div>
			<p>Click on one to join game</p>
			<button onClick={() => { props.socket.emit("fetchListGame"); }}>Refresh</button>
			{listGame.length !== 0 &&
				listGame.map((element: ListGame, index: number) => (
					<div key={index}>
						<p style={{display:"inline"}}>{element.idGame} | {element.playerOne} vs {element.playerTwo}</p>
						<button
							key={index}
							onClick={() => {
								props.socket.emit("addSpectator", {
									idGame: element.idGame,
								});
							}}>
							Spectate
						</button>
					</div>
				))
			}
		</div>
	);
}
