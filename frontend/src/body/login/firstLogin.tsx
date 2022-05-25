import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import store from "../../store/store";
import { CONNECTION_SERVER_APPROVED } from "../../store/userSlice/userSliceActionTypes";
import { API_FIRST_CONNECTION_42_NO_CHANGE, API_SET_USERNAME_42, BASE_URL, DISCONNECTING_URL } from "../../urlConstString";
import Button from '@mui/material/Button';

export default function FirstLogin(props: any) {
	const [errorMessage, setErrorMessage] = useState("");
	const [input, setInput] = useState("");

	const url = new URLSearchParams(useLocation().search);
	const generatedUsername = url.get("generatedUsername");

	function keepSameUsername() {
		fetch(API_FIRST_CONNECTION_42_NO_CHANGE, {
			method: "POST",
			credentials: "include"
		})
		.then(response => {
			if (response.status === 403)
				window.location.assign(DISCONNECTING_URL);
			return (response.json());
		})
		.then(payload => {
			store.dispatch({
				type: CONNECTION_SERVER_APPROVED,
				user: {
					idUser: payload.idUser,
					username: payload.username,
					avatar: payload.avatar,
				},
			});
			window.location.href = BASE_URL;
		})
		.catch(error => {})
	}

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		event.preventDefault();
		setInput(event.target.value);
	}

	const handleSubmit = (event: React.FormEvent<HTMLFormElement> | undefined) => {
		if (event !== undefined)
			event.preventDefault();
		if (input === "")
			return;
		let headers = new Headers();
		headers.append("Content-Type", "application/json");
		fetch(API_SET_USERNAME_42, {
			method: "POST",
			headers: headers,
			credentials: "include",
			body: JSON.stringify({
				newName: input,
			})
		})
		.then(response => {
			if (response.status === 403) {
				// TODO put URL with CONST.
				window.location.assign(DISCONNECTING_URL);
			}
			return (response.json());
		})
		.then(payload => {
			if (payload.message === "Ok") {
				store.dispatch({
					type: CONNECTION_SERVER_APPROVED,
					user: {
						idUser: payload.idUser,
						username: payload.username,
						avatar: payload.avatar,
					},
				});
				// TODO: SET URL WITH CONST
				window.location.href = BASE_URL;
			} else
				setErrorMessage(payload.message);
		})
		.catch (error => {})
	}

	return (
		<div>
			{
				errorMessage.length > 0 &&
				<p className="errorMessage" >{errorMessage}</p>
			}
			<p>
				Enter a new Username<br />
				Your actual username is : <br /><br /><b>{generatedUsername}</b><br /><br />
				Please note that this operation is unique,<br />
				don't leave this page if you don't want this username.<br /><br />
				Choose an other username :
			</p>
			<form id="className" onSubmit={(event) => { handleSubmit(event) }}>
				<label>
					<input type="text" onChange={(event) => handleChange(event)} />
				</label>
			</form><br/>
			<Button variant="contained" onClick={(event) => { handleSubmit(undefined) }}>
				Change username 
			</Button><br />
			<br /><Button variant="contained" onClick={keepSameUsername}>
				Keep my 42 name
			</Button>
		</div>
	);
}
