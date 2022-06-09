import { storeState } from "../../store/types";
import { userState } from "../../store/userSlice/userSliceTypes";
import { connect } from "react-redux";
import { useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, API_USER_RESPONSE_ALERT, DISCONNECTING_URL, URL_INVITATION_GAME } from "../../urlConstString";

import Badge from '@mui/material/Badge';
import MailIcon from '@mui/icons-material/Mail';
import IconButton from '@mui/material/IconButton';
import * as React from 'react';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';

function assembleAlertToHtml(alert: {message: string, needResponse: boolean, requesterId: number, requesteeId: number}[]) {
	const alertsHtml = [];
	if (alert.length === 0)
		return (<p className="userAlertP">No alert, you don't look really popular...</p>)
	for (let i = 0; i < alert.length; i++) {
		let elementsToPush: any;
		if (alert[i].needResponse) {
			elementsToPush = (
				<section style={{borderBottom: "solid 1.5px", textAlign:'center'}} key={i}>
					<p className="userAlertP">
						{alert[i].message}
					</p> 
						<IconButton  onClick={() => {
						let headers = new Headers();
						headers.append("Content-Type", "application/json");
						fetch(API_USER_RESPONSE_ALERT, {
							method: "post",
							credentials: "include",
							headers: headers,
							body: JSON.stringify({
								message: alert[i].message,
								response: "yes",
								requesterId: alert[i].requesterId,
								requesteeId: alert[i].requesteeId
							})
						})
						.then(response => {
							if (response.status === 403)
								window.location.assign(DISCONNECTING_URL);
						});
					}}>
						<CheckIcon color="success" />
					</IconButton> 
					<IconButton  onClick={() => {
						let headers = new Headers();
						headers.append("Content-Type", "application/json");
						fetch(API_USER_RESPONSE_ALERT, {
							method: "post",
							credentials: "include",
							headers: headers,
							body: JSON.stringify({
								message: alert[i].message,
								response: "no",
								requesterId: alert[i].requesterId,
								requesteeId: alert[i].requesteeId
							})
						})
						.then(response => {
							if (response.status === 403)
								window.location.assign(DISCONNECTING_URL);
						});
					}}>
					<CloseIcon color="error" />
					</IconButton>
				</section>
			);
		} else {
			elementsToPush = (
				<section key={i}>
					<p className="userAlertP">
						{alert[i].message}
					</p> <br />
					<Button onClick={() => {
						let headers = new Headers();
						headers.append("Content-Type", "application/json");
						fetch(API_USER_RESPONSE_ALERT, {
							method: "post",
							credentials: "include",
							headers: headers,
							body: JSON.stringify({
								message: alert[i].message,
								requesteeId: alert[i].requesteeId,
								requesterId: -1,
								response: ""
							})
						})
						.then(response => {
							if (response.status === 403)
								window.location.assign(DISCONNECTING_URL);
						})
					}}>Clear</Button>
				</section>
			)
		}
		alertsHtml.push(elementsToPush);
	}
	return (alertsHtml);
}

function UserAlert(props: {user: userState}) {
	// Connect Socket.
	const [socket, setSocket] = useState<Socket>();
	const [showPopUp, setShowPopUp] = useState<{show: boolean, message: string}>({show: false, message: ""});
	const [alert, setAlert] = useState<Array<{message: string, needResponse: boolean, requesterId: number, requesteeId: number}>>([]);
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
	const [alertNbr, setIcon] = useState(0);

	if (socket === undefined) {
		setSocket(io(API_URL, {
			path: "/user/userAlert",
			transports: ["websocket"],
			withCredentials: true,
			reconnection: false,
		}));
	} else if (socket !== undefined) {
			socket.off("disconnectManual");
			socket.on("disconnectManual", () => {
				socket.disconnect();
				window.location.assign(DISCONNECTING_URL);
			})

			socket.off("getUserAlert");
			socket.on("getUserAlert", (...args) => {
				setAlert(args[0].data);
				if (args[0].data !== undefined)
					setIcon(args[0].data.length);
			})

			socket.off("messageReceived");
			socket.on("messageReceived", (...args) => {
				setShowPopUp({
					show: true,
					message: args[0].message,
				});
				setTimeout(() => {
					setShowPopUp({
						show: false,
						message: ""
					})
				}, 5000)
			})

			socket.off("redirectionToBoard");
			socket.on("redirectionToBoard", (...args) => {
				window.location.assign(URL_INVITATION_GAME);
			});

			socket.on("connect_error", (error) => {});
	}

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		setIcon(0);
	  setAnchorEl(event.currentTarget);
	};
  
	const handleClose = () => {
		setIcon(0);
	  setAnchorEl(null);
	};
  
	const open = Boolean(anchorEl);
	const id = open ? 'simple-popover' : undefined;

	if (props.user.isInGame)
		return (null);

	return (
		<div>

		<IconButton aria-describedby={id} onClick={handleClick} size="large"  color="inherit">
		<Badge badgeContent={alertNbr} color="error">
		<MailIcon />
		</Badge>
		</IconButton>
		<Popover
			id={id}
			open={open}
			anchorEl={anchorEl}
			onClose={handleClose}
			max-height="20vh"
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'left',
			}}
			>
			<Typography variant="subtitle1" sx={{ p: 2 }}> 
			{
				showPopUp.show &&
				<p className="errorMessage">	{showPopUp.message}	</p>
			}
			{assembleAlertToHtml(alert)}
		</Typography>
		</Popover>
		</div>
	);
}

function mapStateToProps(state: storeState) {
	return ({
		user: state.user,
	});
}

export default connect(mapStateToProps)(UserAlert);
