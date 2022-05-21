import React, { useState } from 'react';
import { DispatchType, storeState } from '../../store/types';
import { connect } from 'react-redux';
import { userState } from '../../store/userSlice/userSliceTypes';
import { API_AUTH_42_LOGIN, API_AUTH_LOCAL_LOGIN } from '../../urlConstString';
import store from '../../store/store';
import { Navigate, NavLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
// import Alert from '@mui/material/Alert';
// import TextField from '@mui/material/TextField';

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
				let redirectUrl: string | null = response.headers.get("Location");
				if (redirectUrl !== null)
					window.location.assign(redirectUrl);
			}
		});
  };

	if (props.user.isConnected) {
		return (<div><p>You're already connected</p></div>);
	}

	const paperStyle={padding :20,height:'45vh',width:280, margin:"20px auto", backgroundColor:'transparent'}
	const btnstyle={margin:'8px 0'}

	return (
    <div>
        <Grid>
            <Paper elevation={0} style={paperStyle}>
                <Grid >
                     {/* <Avatar style={avatarStyle}><LockOutlinedIcon/></Avatar> */}
                    <h2>Sign In</h2>
                </Grid>
					{
						errorMessage !== "" &&
						<p id='errorMessage'>{errorMessage}</p>
					}
					<form>
					<label>Username</label><br />
					<input  type="text" onChange={(event) => {handleChange(event, "username") }} /><br /><br />
                	{/* <TextField label='Username' placeholder='Enter username' fullWidth required /><br /><br /> */}
					<label>Password</label><br />
					<input  type="password" onChange={(event) => {handleChange(event, "password")} }/><br /><br />
                	{/* <TextField label='Password' placeholder='Enter password' type='password' fullWidth required /> */}
					<p>Not yet registered ? <br /><NavLink to="/register"> create an account </NavLink> </p>
					</form><br />

                <Button type='submit' color='primary' variant="contained" style={btnstyle} fullWidth onClick={handleSubmit}>Login</Button><br />
				<Button variant="contained" href={API_AUTH_42_LOGIN} style={btnstyle} fullWidth >LOGIN WITH 42</Button>

		</Paper>
        </Grid>
    </div>
  );
}

function mapStateToProps(state: storeState) {
  return ({
    user: state.user,
  });
}

export default connect(mapStateToProps)(LoginForm);
