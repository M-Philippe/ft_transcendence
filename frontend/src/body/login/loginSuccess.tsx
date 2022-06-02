import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import store from "../../store/store";
import { CONNECTION_SERVER_APPROVED } from "../../store/userSlice/userSliceActionTypes";

export default function LoginSuccess(props: any) {
	const [redirect, setRedirect] = useState(false);

	const url = new URLSearchParams(useLocation().search);
	const paramsId = url.get("id");
	const paramsUsername = url.get("username");
	const paramsAvatar = url.get("avatar");

	useEffect(() => {
		store.dispatch({
			type: CONNECTION_SERVER_APPROVED,
			user: {
				idUser: paramsId,
				username: paramsUsername,
				avatar: paramsAvatar
			}
		});
		setRedirect(true);
	}, [paramsId, paramsUsername, paramsAvatar]);

	if (redirect) 
	{
		return ( <Navigate replace to="/" /> )
	}

	return (
		<div>
			<p>LOGIN IS A SUCCESS... Redirecting</p>
		</div>
	);
}
