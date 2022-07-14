import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { useCanvas } from "../boardHooks";
import Button from '@mui/material/Button';

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

	useEffect(() => {
		return () => {
			props.socket.disconnect();
		} // eslint-disable-next-line
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

	props.socket.off("endGame")
	props.socket.on("endGame", (...args: any) => {
		props.socket.disconnect();
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
			<p>Choose a game to spectate :</p><br/>
			<Button variant="contained" onClick={() => { props.socket.emit("fetchListGame"); }}>Refresh</Button>
			{listGame.length !== 0 &&
				listGame.map((element: ListGame, index: number) => (
					<div key={index}>
						<Button variant="contained"
							key={index}
							onClick={() => {
								props.socket.emit("addSpectator", {
									playerOne: element.playerOne,
									playerTwo: element.playerTwo,
								});
							}}>
							<p style={{display:"inline"}}>{element.idGame} | {element.playerOne} vs {element.playerTwo}</p>
						</Button>
					</div>
				))
			}
		</div>
	);
}
