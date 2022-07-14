import { useState } from "react";
import { API_AUTH_ENABLE_2FA, API_AUTH_SETUP_2FA, DISCONNECTING_URL } from "../../../urlConstString";
// import Stack from '@mui/material/Stack';
// import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

async function fetch2fa() {
	fetch(API_AUTH_SETUP_2FA, {
		credentials: "include",
	})
	.then(response => {
		if (response.status === 403)
			window.location.assign(DISCONNECTING_URL);
		return (response);
	})
	.then(async payload => {
		let qCode = await payload.text();
		var t = require("qrcode");
		t.toCanvas(document.getElementById("canvasQr"), qCode, function(error: any) {});
	})
	.catch(error => {});
}

export default function Enable2fa(props: any) {
		const [askCode, setAskCode] = useState(false);
		const [errorMessage, setErrorMessage] = useState("");
		const [input, setInput] = useState("");

		const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (input === "")
				return;
			let headers = new Headers();
			headers.append("Content-Type", "application/json");
			fetch(API_AUTH_ENABLE_2FA, {
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
				<p>
					Scan the qr code with google authenticator <br/> then submit your validation code to enable 2fa
				</p>
				{
					errorMessage !== "" &&
					<p className="errorMessage" >{errorMessage}</p>
				}
				{
					askCode &&
					<form onSubmit={(event) => { handleSubmit(event) }}>
						<label>
							Enter generated code<br />
							<input type="text" onChange={(event) => { handleChange(event) }} />
						</label>
					</form>
				}
				<br />
				<Button variant="contained" color="success" onClick={() => {
					fetch2fa();
					setAskCode(true);
				}}> Click here to generate a Qr code</Button>
				<br />
				<br />
				<canvas id="canvasQr" height="0" width="0" ></canvas>
			</section>
		);
}
