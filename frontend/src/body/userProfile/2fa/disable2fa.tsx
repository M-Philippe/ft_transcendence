import { API_AUTH_DISABLE_2FA, DISCONNECTING_URL } from "../../../urlConstString";

export function disable2fa(setStatus2fa: React.Dispatch<React.SetStateAction<boolean>>) {
	fetch(API_AUTH_DISABLE_2FA, {
		method: "post",
		credentials: "include"
	})
	.then(response => {
			if (response.status === 403)
				window.location.assign(DISCONNECTING_URL);
			setStatus2fa(false);
		}
	)
}
