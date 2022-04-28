import { useState } from "react"
import { API_AUTH_VALIDATE_2FA_CODE, DISCONNECTING_URL } from "../../urlConstString";

export default function Query2faCode(props: any) {
	const [input, setInput] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (input === "")
			return;
		let headers = new Headers();
		headers.append("Content-Type", "application/json");
		fetch(API_AUTH_VALIDATE_2FA_CODE, {
			method: "post",
			headers: headers,
			body: JSON.stringify({ twoFactorCode: input }),
			credentials: "include"
		})
		.then(async response => {
			let ret = await response.json();
			if (response.status === 401) {
				setErrorMessage(ret.type);
				return;
			} else if (response.status === 403) {
				window.location.assign(DISCONNECTING_URL);
			} else if (response.status === 302) {
				window.location.assign(ret.location);
			}
			return (response);
		})
		.then(async payload => {})
		.catch(error => {});
	}

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		event.preventDefault();
		setInput(event.target.value);
	}

	return (
		<section>
			{
				errorMessage !== "" &&
				<p style={{color: "red"}}>{errorMessage}</p>
			}
			<p>Submit code from google authenticator</p>
			<form onSubmit={(event) => { handleSubmit(event) }}>
				<input type="text" onChange={(event) => { handleChange(event) }} />
			</form>
		</section>
	)
}
