import React, { useState } from 'react';
import { DispatchType, storeState } from '../../store/types';
import { connect } from 'react-redux';
import { userState } from '../../store/userSlice/userSliceTypes';
import { API_AUTH_42_LOGIN, API_AUTH_LOCAL_LOGIN } from '../../urlConstString';

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

  return (
    <div>
    {
      errorMessage !== "" &&
      <p style={{color:"red"}}>{errorMessage}</p>
    }
    <form id="className">
      <label>Username</label><br />
        <input type="text" onChange={(event) => {handleChange(event, "username") }} /><br />
			<label>Password</label><br />
				<input type="password" onChange={(event) => {handleChange(event, "password")} }/>
		</form>
		<button onClick={handleSubmit}>Login</button>
		<br /><br />
    <a href={API_AUTH_42_LOGIN}>LOGIN WITH 42</a>
    </div>
  );
}

function mapStateToProps(state: storeState) {
  return ({
    user: state.user,
  });
}

export default connect(mapStateToProps)(LoginForm);
