import React, { useState } from "react";
import { connect } from "react-redux";
import { storeState } from "../../store/types";
import { userState } from "../../store/userSlice/userSliceTypes";
import { API_AUTH_42_LOGIN, API_AUTH_LOCAL_REGISTER, BASE_URL, API_AUTH_LOCAL_LOGIN } from "../../urlConstString";
import { Navigate } from 'react-router-dom';

import Button from '@mui/material/Button';
// import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

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
	const [redirectUrl, setRedirectUrl] = useState("");

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
				fetch(API_AUTH_LOCAL_LOGIN, {
					method: "post",
					headers: headers,
					body: JSON.stringify(userInput),
					// Even if there are no credentials to include from client-side, to be able to set cookie received by server-side, we must set credentials to "include" else the browser will ignore cookies.
					credentials: "include"
				})
				.then(async response => {
					if (response.status === 401) {
						let payload = await response.json();
						setErrorMessage(payload.type);
					} else if (response.status === 201) {
						let url: string | null = response.headers.get("Location");
						if (url !== null)
							setRedirectUrl(url.slice(BASE_URL.length));
					}
				});
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

	if (redirectUrl !== "")
	return (
		<Navigate to={redirectUrl}/>
	)

	const keyDownHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.code === "Enter" || event.code === "NumpadEnter") {
			handleSubmit();
		}
	};
	return (
        <Grid>
                <h2>Register</h2>
				{ errorMessage !== "" && <p className="errorMessage" >{errorMessage}</p> }
				<form>
                	{/* <TextField label='Username' placeholder='Enter username' fullWidth required /><br /><br /> */}
                	{/* <TextField label='Password' placeholder='Enter password' type='password' fullWidth required /> */}
				<label>Username</label><br />
					<input type="text" onKeyDown={keyDownHandler} onChange={(event) => {handleChange(event ,"username")}}/><br /><br />
				<label>Password</label><br />
					<input type="password" onKeyDown={keyDownHandler} onChange={(event) => {handleChange(event, "password")}}/><br /><br />
				<label>Confirm Password</label><br />
					<input type="password" onKeyDown={keyDownHandler} onChange={(event) => {handleChange(event, "confirmPassword")}}/> <br /><br />
				</form><br />
				<Stack margin="auto" sx={{ width: '20%', }} spacing={2}>
                <Button type='submit' color='primary' variant="contained" style={{margin:'8px 0'}} fullWidth onClick={handleSubmit}>Register</Button><br />
				<Button variant="contained" href={API_AUTH_42_LOGIN} style={{margin:'8px 0'}} fullWidth >LOGIN WITH 42</Button>
				</Stack>
        </Grid>
	);
}

function mapStateToProps(state: storeState) {
	return ({
		user: state.user,
	});
}

export default connect(mapStateToProps)(Register);
