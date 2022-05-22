import { useCanvas } from "./boardHooks";
import { Socket } from 'socket.io-client';
import { useState } from "react";
import { connect } from 'react-redux';
import { DispatchType, storeState } from '../../store/types';
import { SET_ID_GAME, SET_USER_INGAME, UNSET_USER_INGAME } from "../../store/userSlice/userSliceActionTypes";
import { Navigate } from "react-router-dom";
import { userState } from "../../store/userSlice/userSliceTypes";
import { API_MATCHES_PLAYER_LEAVING } from "../../urlConstString";
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface BoardProps {
	socket: Socket,
	user: userState,
	dispatch: DispatchType,
}

interface InheritedProps {
	socket: Socket,
}

function mapStateToProps(state: storeState, props: InheritedProps) {
	return ({
		username: state.user.username,
		user: state.user,
		socket: props.socket,
	})
}

function Board(props: BoardProps) {
	const [coordinates, setCoordinates, canvasRef] = useCanvas();
	const [idBoard, setIdBoard] = useState(0);
	const [palletAssigned, setPalletAssigned] = useState(-1);
	const [cancelGame, setCancelGame] = useState(false);
	const [searchingMessage, setSearchingMessage] = useState("Searching for a similar game or creating a new one.");


	props.socket.off("disconnect");
	props.socket.on("disconnect", () => {
		let params = {
			username: props.user.username,
			idGame: props.user.idGame,
		};
		let req = new XMLHttpRequest();
		req.open(
			"post",
			API_MATCHES_PLAYER_LEAVING);
		req.setRequestHeader("Content-Type", "application/json");
		req.send(JSON.stringify(params));
		props.dispatch({
			type: UNSET_USER_INGAME,
			user: {...props.user},
		})
	});

	if (cancelGame)
		return (
			<Navigate replace to="/ranking" />
		);

	const moveRacket = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === "ArrowDown") {
			props.socket.emit("movePallet", {
				username: props.user.username,
				idGame: idBoard,
				direction: "down",
			});
			if (palletAssigned === 0)
				coordinates.palletAY += coordinates.speedPalet;
			else if (palletAssigned === 1)
				coordinates.palletBY += coordinates.speedPalet;
			setCoordinates(coordinates);
		} else if (event.key === "ArrowUp") {
			props.socket.emit("movePallet", {
				username: props.user.username,
				idGame: idBoard,
				direction: "up",
			});
			if (palletAssigned === 0)
				coordinates.palletAY -= coordinates.speedPalet;
			else if (palletAssigned === 1)
				coordinates.palletBY -= coordinates.speedPalet;
			setCoordinates(coordinates);
		}
	}

	//document.addEventListener("visibilitychange", alertServerPlayerLeavingGame);

	props.socket.off("idGame");
	props.socket.on("idGame", (...args: any) => {
		props.dispatch({
			type: SET_ID_GAME,
			user: {...props.user, idGame: args[0].idGame},
		});
	});

	props.socket.off("updatePositions");
	props.socket.on("updatePositions", (...args: any) => {
		setCoordinates(args[0].positions);
		setIdBoard(args[0].id);
		if (palletAssigned === -1) {
			setPalletAssigned(args.palletAssigned);
		}
		// if first positions dispatch inGame
		if (!props.user.isInGame) {
			props.dispatch({
				type: SET_USER_INGAME,
				user: props.user,
			});
		}
	});

	props.socket.off("endGame");
	props.socket.on("endGame", (...args: any) => {
		props.socket.disconnect();
		props.dispatch({
			type: UNSET_USER_INGAME,
			user: props.user,
		});
	});

	props.socket.off("alreadyCreatedMatch");
	props.socket.on("alreadyCreatedMatch", (...args: any) => {
		setSearchingMessage("You already have a game pending, search will continue");
		setIdBoard(args[0].idGame);
	});

	if (coordinates.width === 0) {
		return (
			<div>
					<CircularProgress sx={{color: 'white'}}/><br/><br/>
				<p>{searchingMessage}</p><br/>
				<Button variant="contained" color="error" onClick={() => {
					props.socket.emit("cancelMatch", {
						username: props.user.username,
					})
					setCancelGame(true);
				}}>Cancel</Button>
			</div>
		);
	}

	return (
			<div>
				<canvas
					ref={canvasRef}
					id="board"
					width={coordinates.width}
					height={coordinates.height}
					onKeyDown={(e) => moveRacket(e)}
					tabIndex={0}
				>
				</canvas>
			</div>
	);
}

export default connect(mapStateToProps)(Board);
