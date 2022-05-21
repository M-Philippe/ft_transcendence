import { userState } from "../../store/userSlice/userSliceTypes";
import { DispatchType, storeState } from "../../store/types";
import { connect } from "react-redux";
import /*React,*/ { useEffect, useState } from "react";
//import pencil from "./pencil.jpg";
import { Navigate } from "react-router-dom";
import { disable2fa } from "./2fa/disable2fa";
import AvatarUpload from "./avatarUpload";
import UserRelationships from "./userRelationships";
import ChangePassword from './changePassword';
import { API_USER_2FA_ENABLED, DISCONNECTING_URL } from "../../urlConstString";
import { Link } from "react-router-dom";
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

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
		fetch(API_USER_2FA_ENABLED, {
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
			<Navigate to="/enable2fa" />
			// <Navigate to="/enable2fa" push={true} /> 
		);

		return (
		<Box sx={{ width: '100%', minWidth: '400px'}}>
			<p><b>{props.user.username}</b></p>
			<img id = "avatarMyProfil" src={props.user.avatar} alt="avatarUser" /><br /><br />
			<AvatarUpload />
      		<Stack margin="auto" sx={{ width: '35%', }} spacing={2}>
			<Button id ="ChangePasswButton" variant="contained" onClick={() => {setShowChangePassword(true); 
				document.getElementById('ChangePasswButton')?.remove();
				document.getElementById('avatar')?.setAttribute('style', 'height:20%');
				document.getElementById('avatar')?.setAttribute('style', 'width:20%')}}
				>Change my password</Button>
			{
				showChangePassword &&
				<ChangePassword />
			}
			{
				status2fa &&
				<Button variant="contained" onClick={() => { disable2fa(); }}>Disable 2fa</Button>
			}
			{
				!status2fa &&
				<Button variant="contained" onClick={() => { setRedirect2fa(true); }}>Enable 2fa</Button>
			}
			<UserRelationships />
			<Button component={Link} to="/matchHistory" variant="contained" state={{username: props.user.username}}>Match History</Button>

			</Stack>
    	</Box>
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
