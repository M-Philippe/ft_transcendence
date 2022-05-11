import React, { useState } from "react";
import { connect } from "react-redux";
import { storeState } from "../../store/types";
import { userState } from "../../store/userSlice/userSliceTypes";
import { API_AUTH_42_LOGIN, API_AUTH_LOCAL_REGISTER, BASE_URL, CONNECT_FORM_URL } from "../../urlConstString";

interface UserInput {
	username: string,
	password: string,
	confirmPassword: string,
}

function Register(props: {user: userState}) {
	if (props.user.isConnected)
		window.location.assign(BASE_URL);

	const [userInput, setUserInput] = useState<UserInput>({
		username: "",
		password: "",
		confirmPassword: "",
	});
	const [errorMessage, setErrorMessage] = useState("");

	const handleSubmit = () => {
		let headers = new Headers();
		headers.append("Content-Type", "application/json");
		fetch(API_AUTH_LOCAL_REGISTER,
		{
			method: "post",
			headers: headers,
			body: JSON.stringify(userInput),
		})
		.then(async response => {
			if (response.status === 400) {
				let payload = await response.json();
				console.log(payload);
				setErrorMessage(payload.description);
			} else if (response.status === 201) {
				window.location.assign(CONNECT_FORM_URL);
			}
		})
		.catch (error => {});
	}

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>, fieldToUpdate: "username" | "password" | "confirmPassword") => {
		event.preventDefault();
		setUserInput({
			...userInput,
			[fieldToUpdate]: event.target.value,
		});
	}

	return (
		<section>
			{ errorMessage !== "" && <p style={{color: "red"}}>{errorMessage}</p> }
			<p>Register :</p>
			<form>
				<label>Username</label><br />
					<input type="text" onChange={(event) => {handleChange(event ,"username")}}/><br /><br />
				<label>Password</label><br />
					<input type="password" onChange={(event) => {handleChange(event, "password")}}/><br /><br />
				<label>Confirm Password</label><br />
					<input type="password" onChange={(event) => {handleChange(event, "confirmPassword")}}/>
			</form><br />
			<button onClick={handleSubmit}>Register</button> <br /><br />
			<a href={API_AUTH_42_LOGIN}>REGISTER WITH 42</a>
		</section>
	);
}

function mapStateToProps(state: storeState) {
	return ({
		user: state.user,
	});
}

export default connect(mapStateToProps)(Register);
