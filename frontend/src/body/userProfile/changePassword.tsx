import { useState } from "react";
import { API_USER_CHANGE_PASSWORD, DISCONNECTING_URL } from "../../urlConstString";

interface UserInput {
	currentPassword: string,
	newPassword: string,
	confirmNewPassword: string,
}

export default function ChangePassword(props: any) {
const [userInput, setUserInput] = useState<UserInput>({
	currentPassword: "",
	newPassword: "",
	confirmNewPassword: "",
});
const [errorMessage, setErrorMessage] = useState("");

const handleSubmit = () => {
	let headers = new Headers();
	headers.append("Content-Type", "application/json");
	fetch(API_USER_CHANGE_PASSWORD, {
		method: "post",
		headers: headers,
		body: JSON.stringify(userInput),
		credentials: "include",
	})
	.then(async response => {
		if (response.status === 401) {
			let payload = await response.json();
			setErrorMessage(payload.description);
		} else if (response.status === 201 || response.status === 403) {
			window.location.assign(DISCONNECTING_URL);
		}
	})
	.catch (error => {});
}

const handleChange = (event: React.ChangeEvent<HTMLInputElement>, fieldToUpdate: "currentPassword" | "newPassword" | "confirmNewPassword") => {
	event.preventDefault();
	setUserInput({
		...userInput,
		[fieldToUpdate]: event.target.value,
	});
}

	return (
		<div>
			{
				errorMessage &&
				<p style={{color:"red"}}>{errorMessage}</p>
			}
			<form>
				<label>Current Password</label><br />
					<input type="password" onChange={(event) => {handleChange(event ,"currentPassword")}}/><br />
				<label>New Password</label><br />
					<input type="password" onChange={(event) => {handleChange(event, "newPassword")}}/><br />
				<label>Confirm New Password</label><br />
					<input type="password" onChange={(event) => {handleChange(event, "confirmNewPassword")}}/>
			</form>
			<button onClick={handleSubmit}>Submit</button>
		</div>
	)
}
