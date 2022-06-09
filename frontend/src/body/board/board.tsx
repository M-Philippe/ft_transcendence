import { useCanvas } from "./boardHooks";
import { Socket } from 'socket.io-client';
import { useState, useEffect } from "react";
import { connect } from 'react-redux';
import { DispatchType, storeState } from '../../store/types';
import { SET_ID_GAME, SET_USER_INGAME, UNSET_USER_INGAME } from "../../store/userSlice/userSliceActionTypes";
import { Navigate } from "react-router-dom";
import { userState } from "../../store/userSlice/userSliceTypes";
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
	const [endGame, setEndGame] = useState(false);
	const [palletAssigned, setPalletAssigned] = useState(-1);
	const [cancelGame, setCancelGame] = useState(false);
	const [searchingMessage, setSearchingMessage] = useState("Searching for a similar game or creating a new one.");

	useEffect(() => {
		return () => {
			props.socket.disconnect();
			props.dispatch({type: UNSET_USER_INGAME, user: props.user});
		} // eslint-disable-next-line
	}, []);


	if (cancelGame || endGame)
		return (
			<Navigate replace to="/ranking" />
		);

	const keyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
		event.preventDefault();
		if (event.key === "ArrowUp") {
			props.socket.emit("keyDown", {
				username: props.user.username,
				direction: "up"
			});
		} else if (event.key === "ArrowDown") {
			props.socket.emit("keyDown", {
				username: props.user.username,
				direction: "down",
			});
		}
	}

	const keyUp = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
		event.preventDefault();
		if (event.key === "ArrowUp") {
			props.socket.emit("keyUp", {
				username: props.user.username,
				direction: "up"
			});
		} else if (event.key === "ArrowDown") {
			props.socket.emit("keyUp", {
				username: props.user.username,
				direction: "down",
			});
		}
	}

	props.socket.off("idGame");
	props.socket.on("idGame", (...args: any) => {
		props.dispatch({
			type: SET_ID_GAME,
			user: {...props.user, idGame: args[0].idGame},
		});
	});

	props.socket.off("updatePositions");
	props.socket.on("updatePositions", (...args: any) => {
		if (palletAssigned === -1) {
			setPalletAssigned(args[0].palletAssigned);
		}
		// console.error("PALLET_ASSIGNED_UPDATE: ", palletAssigned);
		setCoordinates(args[0].positions);
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
		setTimeout(() => setEndGame(true), 5000);
	});

	props.socket.off("alreadyCreatedMatch");
	props.socket.on("alreadyCreatedMatch", (...args: any) => {
		setSearchingMessage("You already have a game pending, search will continue");
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
					onKeyDown={(e) => keyDown(e)}
					onKeyUp={(e) => keyUp(e)}
					tabIndex={0}
				>
				</canvas>
			</div>
	);
}

export default connect(mapStateToProps)(Board);
