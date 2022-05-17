import { storeState } from "../../store/types";
import { userState } from "../../store/userSlice/userSliceTypes";
import { connect } from "react-redux";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import envelopeImg from '../../../src/styles/medias/envelope.png';
// import envelopeImgNotif from '../../../src/styles/medias/envelopeNotif.png';
import { API_URL, API_USER_RESPONSE_ALERT, DISCONNECTING_URL, URL_INVITATION_GAME } from "../../urlConstString";

interface IShowAlert {
	alert: {message: string, needResponse: boolean, requesterId: number, requesteeId: number}[],
	setShowAlert: React.Dispatch<React.SetStateAction<boolean>>
}

function assembleAlertToHtml(alert: {message: string, needResponse: boolean, requesterId: number, requesteeId: number}[]) {
	const alertsHtml = [];
	if (alert.length === 0)
		return (<p>No alert, you don't look really popular...</p>)
	for (let i = 0; i < alert.length; i++) {
		let elementsToPush: any;
		if (alert[i].needResponse) {
			elementsToPush = (
				<section key={i}>
					<p style={{borderBottom: "solid 1px"}}>
						{alert[i].message}
					</p> <br />
					<button  onClick={() => {
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
						YES
					</button>
					<button  onClick={() => {
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
						NO
					</button>
				</section>
			);
		} else {
			elementsToPush = (
				<section key={i}>
					<p style={{border: "solid 1px"}}>
						{alert[i].message}
					</p> <br />
					<button onClick={() => {
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
					}}>Clear</button>
				</section>
			)
		}
		alertsHtml.push(elementsToPush);
	}
	return (alertsHtml);
}

function ShowAlert(props: IShowAlert) {
	return (
		<div
			style={{backgroundColor: "lightblue", position: "absolute", border: "solid 1px", width:"150px"}}
			onMouseLeave={() => props.setShowAlert(false)} >
			{assembleAlertToHtml(props.alert)}
		</div>
	);
}


function UserAlert(props: {user: userState}) {
	// Connect Socket.
	const [socket, setSocket] = useState<Socket>();
	const [showAlert, setShowAlert] = useState(false);
	const [showPopUp, setShowPopUp] = useState<{show: boolean, message: string}>({show: false, message: ""});
	const [alert, setAlert] = useState<Array<{message: string, needResponse: boolean, requesterId: number, requesteeId: number}>>([]);

	useEffect(() => {
		//if (socket !== undefined)
		//	socket.emit("tst");
	})
	if (socket === undefined) {
		setSocket(io(API_URL, {
			path: "/user/userAlert",
			transports: ["websocket"],
			withCredentials: true,
			reconnection: false,
		}));
	} else if (socket !== undefined) {
			socket.on("connect", () => {
				//console.log("USER ALERT CONNECT");
			});

			socket.on("disconnect", () => {
				//console.error("SERVER HAS DISCONNECTED YOU");
			})

			socket.off("disconnectManual");
			socket.on("disconnectManual", () => {
				console.log("DISCONNECT_MANUAL");
				socket.disconnect();
			})

			socket.off("getUserAlert");
			socket.on("getUserAlert", (...args) => {
				//console.log("RECEIVED ALERT: ", args[0].data);
				setAlert(args[0].data);
				/* CHANGE ICON HERE */
			})

			socket.off("messageReceived");
			socket.on("messageReceived", (...args) => {
				//console.log("MESSAGE COME");
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
				//console.log("REDIRECTION RECEIVED");
				window.location.assign(URL_INVITATION_GAME);
			});

			socket.on("connect_error", (error) => {
				//console.log("ERROR: ", error);
			});
	}

	return (
		<div>
			{
				showAlert &&
				<ShowAlert alert={alert} setShowAlert={setShowAlert} />
			}
			{
				showPopUp.show &&
				<p>
					{showPopUp.message}
				</p>
			}
			<input id = "alert" className="imgHeader" type="image" src={ envelopeImg } alt="Alert" onMouseEnter={() => {
				setShowAlert(!showAlert); }}/>
		</div>
	);
}

function mapStateToProps(state: storeState) {
	return ({
		user: state.user,
	});
}

export default connect(mapStateToProps)(UserAlert);
