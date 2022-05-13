import { userState } from "../../store/userSlice/userSliceTypes";
import { DispatchType, storeState } from "../../store/types";
import { connect } from "react-redux";
import /*React,*/ { useEffect, useState } from "react";
//import pencil from "./pencil.jpg";
import { Redirect } from "react-router-dom";
import { disable2fa } from "./2fa/disable2fa";
import AvatarUpload from "./avatarUpload";
import UserRelationships from "./userRelationships";
import ChangePassword from "./changePassword";
import { DISCONNECTING_URL } from "../../urlConstString";

interface UserProfileProps {
	user: userState;
	dispatch: DispatchType;
}

function UserProfile(props: UserProfileProps) {
	const [redirect2fa, setRedirect2fa] = useState(false);
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [status2fa, setStatus2fa] = useState(false);

	useEffect(() => {
		const controller = new AbortController();
		fetch("http://localhost:3000/users/is2faEnabled", {
			method: "get",
			credentials: "include",
			signal: controller.signal
		})
		.then(async response => {
			if (response.status === 403)
				window.location.assign(DISCONNECTING_URL);
			else if (response.status === 200) {
				setStatus2fa((await response.json()).is2faEnabled);
			}
		});
		return () => {
			controller.abort();
		}
	});

	if (redirect2fa)
		return(
			<Redirect to="/enable2fa" push={true} />
		);

	return (
		<div>
			<p><b>{props.user.username} </b></p>
			<img id = "avatarMyProfil" src={props.user.avatar} alt="avatarUser" /><br /><br />
			<AvatarUpload />
			<button id ="ChangePasswButton" className="action-button shadow animate blue" onClick={() => {setShowChangePassword(true); 
				document.getElementById('ChangePasswButton')?.remove();
				document.getElementById('avatar')?.setAttribute('style', 'height:15%');
				document.getElementById('avatar')?.setAttribute('style', 'width:15%')}}
				>Change my password</button><br />
			{
				showChangePassword &&
				<ChangePassword />
			}
			{
				status2fa &&
				<button className="action-button shadow animate blue" onClick={() => { disable2fa(); }}>Disable 2fa</button>
			}
			{
				!status2fa &&
				<button className="action-button shadow animate blue" onClick={() => { setRedirect2fa(true); }}>Enable 2fa</button>
			}
			<UserRelationships />
		</div>
	);
}

function mapStateToProps(state: storeState) {
	return ({
		user: state.user,
	});
}

// function modifyImageSize(state: storeState) {
// 	return ({
// 		user: state.user,
// 	});
// }

export default connect(mapStateToProps)(UserProfile);
