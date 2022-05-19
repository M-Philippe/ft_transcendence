import { Navigate } from "react-router-dom";
import store from "../../store/store";
import { DISCONNECT_USER } from "../../store/userSlice/userSliceActionTypes";
import { API_USER_DISCONNECT } from "../../urlConstString";

export default function Disconnecting(props: any) {
		fetch(API_USER_DISCONNECT, {
			method: "put",
			credentials: "include",
		})
		.then(response => {});

	if (store.getState().user.isConnected) {
		store.dispatch({
			type: DISCONNECT_USER,
			user: {},
		});
	}
	if (!store.getState().user.isConnected) {
		return (<Navigate replace to="/" /> )
	}
	return (
		<div>
			<p>Leaving site.</p>
		</div>
	);
}
