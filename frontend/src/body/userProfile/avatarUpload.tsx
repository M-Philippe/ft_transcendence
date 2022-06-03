import { DispatchType, storeState } from "../../store/types";
import { userState } from "../../store/userSlice/userSliceTypes";
import { connect } from "react-redux";
import { useState } from "react";
import { API_USER_AVATAR_UPLOAD, DISCONNECTING_URL } from "../../urlConstString";
import { UPDATE_AVATAR } from "../../store/userSlice/userSliceActionTypes";
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

function AvatarUpload(props: { user: userState, dispatch: DispatchType }) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files === null)
			return;
			console.log("FILES SIZE :" + event.target.files[0].size);
		if(event.target.files[0].size > 5097152)
		{
			alert("Your avatar is too big, max size: 5mo");
			event.target.files = null;
			document.getElementById('submitAvatarButton')?.remove();
			return;
		};	
		document.getElementById('submitAvatarButton')?.setAttribute('style', 'visibility:visible');
		console.log(event.target.files[0]);
		setSelectedFile(event.target.files[0]);
	}

	const handleSubmit = () => {
		if (selectedFile === null)
		{
			document.getElementById('submitAvatarButton')?.remove();
			return;
		}
		const data = new FormData();
		data.append("avatar", selectedFile);
		fetch(API_USER_AVATAR_UPLOAD, {
			method: "post",
			credentials: "include",
			body: data
		})
		.then(async response => {
			if (response.status === 403)
				window.location.assign(DISCONNECTING_URL);
			else if (response.status === 201) {
				let payload = await response.json();
				props.dispatch({
					type: UPDATE_AVATAR,
					user: {...props.user, avatar: payload}
				});
			}
		});
		document.getElementById('submitAvatarButton')?.remove();
	}

	const Input = styled('input')({
		display: 'none',
	  });

	return (
		<div>
			<label>Modify your avatar :</label><br /><br />
			<label htmlFor="contained-button-file">
        <Input accept="image/*" id="contained-button-file" multiple type="file" onChange={handleChange} />
			<Button variant="contained" color="info" component="span" >
			Browse...
			</Button><br />
		</label>
			<Button id = "submitAvatarButton" variant="contained" color="success" style={{visibility:"hidden"}} onClick={handleSubmit}>Submit new avatar</Button>
			<br /><br />
		</div>
	);
}

function mapStateToProps(state: storeState) {
	return ({
		user: state.user,
	});
}

export default connect(mapStateToProps)(AvatarUpload);
