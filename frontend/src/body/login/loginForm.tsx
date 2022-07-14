import React, { useState } from 'react';
import { DispatchType, storeState } from '../../store/types';
import { connect } from 'react-redux';
import { userState } from '../../store/userSlice/userSliceTypes';
import { API_AUTH_42_LOGIN, API_AUTH_LOCAL_LOGIN, BASE_URL } from '../../urlConstString';
import store from '../../store/store';
import { Navigate, NavLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

interface ConnectFormProps {
  user: userState;
  dispatch: DispatchType;
}

interface UserInput {
	username: string,
	password: string,
}

function LoginForm(props: ConnectFormProps) {
	const [errorMessage, setErrorMessage] = useState("");
	const [redirectUrl, setRedirectUrl] = useState("");
	const [userInput, setUserInput] = useState<UserInput>({
		username: "",
		password: "",
	});

	if (store.getState().user.isConnected) {
		return (<Navigate to="/" replace={true}/>);
	}

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, fieldToUpdate: "username" | "password") => {
		event.preventDefault();
		setUserInput({
			...userInput,
			[fieldToUpdate]: event.target.value,
		});
  };

  const handleSubmit = () => {
		let headers = new Headers();
		headers.append("Content-Type", "application/json");
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
  };

	if (props.user.isConnected) {
		return (<div><p>You're already connected</p></div>);
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
        <div >
			<h2>Sign In</h2>
			{
				errorMessage !== "" &&
				<p className='errorMessage'>{errorMessage}</p>
			}
			<form>
			<label>Username</label><br />
			<input autoFocus type="text" onKeyDown={keyDownHandler} onChange={(event) => {handleChange(event, "username") }} /><br /><br />
			<label>Password</label><br />
			<input  type="password" onKeyDown={keyDownHandler} onChange={(event) => {handleChange(event, "password")} }/><br /><br />
			<p>Not yet registered ? <br /><NavLink to="/register"> create an account </NavLink> </p>
			</form><br />
		<Stack margin="auto" sx={{ width: '20%', }} spacing={2}>
		<Button type='submit' color='primary' variant="contained" style={{margin:'8px 0'}} fullWidth onClick={handleSubmit}>Login</Button><br />
		<Button variant="contained" href={API_AUTH_42_LOGIN} style={{margin:'8px 0'}} fullWidth >LOGIN WITH 42</Button>
		</Stack>
	</div>
  );
}

function mapStateToProps(state: storeState) {
  return ({
    user: state.user,
  });
}

export default connect(mapStateToProps)(LoginForm);
