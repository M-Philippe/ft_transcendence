import { useState } from "react";
import { Navigate } from "react-router-dom";
import store from "../../store/store";
import { DISCONNECT_USER } from "../../store/userSlice/userSliceActionTypes";
import { API_USER_DISCONNECT, BASE_URL } from "../../urlConstString";

export default function Disconnecting(props: any) {
	const [leaving, setLeaving] = useState(false);
	
	fetch(API_USER_DISCONNECT, {
		method: "put",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({}),
		credentials: "include",
	})
	.then(response => {
		setLeaving(true);
	});

	if (store.getState().user.isConnected) {
		store.dispatch({
			type: DISCONNECT_USER,
			user: {},
		});
	} 
	if (leaving) {
		window.location.assign(BASE_URL);
		return(<p>Redirecting to /</p>);
	}
	return (<p>LEAVING THE SITE</p>);
}
