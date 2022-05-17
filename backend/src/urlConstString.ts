/*
**	FRONT_URL
*/

const domain = "10.1.1.4";
const port = "3005";
export const BASE_URL = "http://" + domain + ":" + port;
export const API_URL = "http://" + domain + ":" + "3000";

export const FRONT_GENERIC_AVATAR =  API_URL + "/users/avatar/genericAvatar";
// http://localhost:3000/users/avatar/genericAvatar
export const FRONT_LOGIN_SUCCESS = BASE_URL + "/loginSuccess";
// http://localhost:3005/loginSuccess
export const FRONT_DISCONNECTING = BASE_URL + "/disconnecting";
// http://localhost:3005/disconnecting
export const FRONT_42_LOGIN_FAILED = BASE_URL + "/loginFailed";
// http://localhost:3005/loginFailed
export const FRONT_QUERY_2FA_CODE = BASE_URL + "/query2faCode";
// http://localhost:3005/query2faCode
export const FRONT_42_FIRST_LOGIN_CHANGE_NAME = BASE_URL + "/firstLogin?generatedUsername=";
// http://localhost:3005/firstLogin?generatedUsername=
export const API_USER_AVATAR = API_URL + "/users/avatar/";
// http://localhost:3000/users/avatar/
