import { useState } from "react";
import { Socket } from "socket.io-client";
import { connect } from "react-redux";
import { SocketHandler } from "../socketHandler";
import { storeState } from "../../../store/types";
import Board from "../board";

function InvitationGame(props: {username: string}) {
	const [socket, setSocket] = useState<Socket>();

	if (socket !== undefined) {
		socket.emit("userReadyToPlay");
		return (
			<Board socket={socket} />
		);
	} else if (socket === undefined) {
		return (
			<div>
				{
					socket === undefined &&
					<SocketHandler
						setSocket={setSocket}
						username={props.username}
					/>
				}
				<p>We are connecting you to the desired game!</p>
			</div>
		);
	} else
		return (
			<div>
				<p>ERROR CONNECTION, RETRY LATER!</p>
			</div>
		)
}

function mapStateToProps(state: storeState) {
	return ({
		username: state.user.username
	});
}

export default connect(mapStateToProps)(InvitationGame);
