import { DispatchType, storeState } from "../../store/types";
import { userState } from "../../store/userSlice/userSliceTypes";
import { connect } from "react-redux";
import { useState } from "react";
import { API_USER_AVATAR_UPLOAD, DISCONNECTING_URL } from "../../urlConstString";
import { UPDATE_AVATAR } from "../../store/userSlice/userSliceActionTypes";

function AvatarUpload(props: { user: userState, dispatch: DispatchType }) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files === null)
			return;
		console.log(event.target.files[0]);
		setSelectedFile(event.target.files[0]);
	}

	const handleSubmit = () => {
		if (selectedFile === null)
			return;
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
	}

	return (
		<div>
			<label>Upload your avatar (only jpg)</label>
			<input type="file" accept=".jpg" name="avatar_upload" onChange={handleChange}/>
			<br />
			<button onClick={handleSubmit}>Submit</button>
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
