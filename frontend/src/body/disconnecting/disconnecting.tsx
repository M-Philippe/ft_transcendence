import { useEffect } from "react";
import { DISCONNECT_USER } from "../../store/userSlice/userSliceActionTypes";
import { API_USER_DISCONNECT, BASE_URL } from "../../urlConstString";
import { Navigate } from "react-router-dom";
import { connect } from "react-redux";
import { DispatchType, storeState } from "../../store/types";
import { userState } from "../../store/userSlice/userSliceTypes";

function Disconnecting(props: { user: userState, dispatch: DispatchType }) {
	
	useEffect(() => {
		if (props.user.isConnected)
			props.dispatch({
				type: DISCONNECT_USER,
				user: props.user,
			});
	})

	if (!props.user.isConnected) {
		fetch(API_USER_DISCONNECT, {
			method: "put",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({}),
			credentials: "include",
		});
		return(<Navigate to={BASE_URL} />);
	}
	return (<p>Leaving.</p>)
}

function mapStateToProps(state: storeState) {
	return ({
		user: state.user,
	});
}

export default connect(mapStateToProps)(Disconnecting);