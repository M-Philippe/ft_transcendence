import { useState } from "react";
import { API_AUTH_ENABLE_2FA, API_AUTH_SETUP_2FA, DISCONNECTING_URL } from "../../../urlConstString";

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
		t.toCanvas(document.getElementById("canvasQr"), qCode, function(error: any) {
			if (error)
				console.error(error);
		})
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
			console.error("I'VE DONE ENABLE");
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
				console.error("return: ", response.json());
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
					Scan the qr code with google authenticator then submit your validation code to enable 2fa.
				</p>
				{
					errorMessage !== "" &&
					<p style={{color: "red"}}>{errorMessage}</p>
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
				<button onClick={() => {
					fetch2fa();
					setAskCode(true);
				}}>
					CLICK TO GENERATE QR CODE
				</button><br /><br />
				<canvas id="canvasQr" height="0" width="0" ></canvas>
			</section>
		);
}
