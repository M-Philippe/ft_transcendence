/*
**	FRONT_URL
*/

const domain = "10.1.4.3";
const port = "3005";
export const BASE_URL = "http://" + domain + ":" + port;
export const BASE_API_URL = "http://" + domain + ":3000";

/*
**	USER
*/

export const USER_MY_PROFILE = BASE_URL + "/myProfile";
//	http://localhost:3005/myProfile

/*
**	CHAT
*/

export const SOCKET_CHAT = '/socket.io/chat';

/*
**	MATCHESONGOING
*/

export const SOCKET_MATCHESONGOING = "/socket.io/matchesOnGoing";
export const URL_INVITATION_GAME = BASE_URL + "/invitationGame";
//	http://localhost:3005/invitationGame

/*
**	LOGIN / DISCONNECT
*/

export const CONNECT_FORM_URL = BASE_URL + "/login";
export const DISCONNECTING_URL = BASE_URL + "/disconnecting";

/*
** API_URL
*/

const apiPort = "3000";
export const API_URL = "http://" + domain + ":" + apiPort;

/*
**	USER
*/
export const API_USER_RANKING = API_URL + "/users";
export const API_USER_DISCONNECT = API_URL + "/users/disconnectUser";
//	http://localhost:3000/users/disconnectUser
export const API_USER_CONNECT = API_URL + "/users/connectUser";
// http://localhost:3000/users/connectUser
export const API_SET_USERNAME_42 = API_URL + "/users/setUsernameFirstConnection42";
//	http://localhost:3000/users/setUsernameFirstConnection42
export const API_FIRST_CONNECTION_42_NO_CHANGE = API_URL + "/users/usernameFirstConnection42NoChange";
//	http://localhost:3000/users/usernameFirstConnection42NoChange
export const API_USER_AVATAR_UPLOAD = API_URL + "/users/avatarUpload";
//	http://localhost:3000/users/avatarUpload
export const API_USER_VIEW = API_URL + "/users/name/";
//	http://localhost:3000/users/name/ + {username}
export const API_USER_INVITE_MATCH = API_URL + "/users/inviteMatch";
//	http://localhost:3000/users/inviteMatch
export const API_USER_RESPONSE_ALERT = API_URL + "/users/responseAlert";
//	http://localhost:3000/users/responseAlert
export const API_USER_SOCKET_PATH = "/socket.io/user";
//	/socket.io/user
export const API_USER_LIST_CHAT = API_URL + "/users/listChat/";
//	http://localhost:3000/users/listChat/ + {username}
export const API_USER_CHANGE_PASSWORD = API_URL + "/users/changePassword";
//	http://localhost:3000/users/changePassword
export const API_USER_2FA_ENABLED = API_URL + "/users/is2faEnabled";
// http://localhost:3000/users/is2faEnabled
export const API_USER_GAME_INFOS = API_URL + "/users/gameInfos";
// http://localhost:3000/users/gameInfos

/*
**	AUTH
*/
export const API_AUTH_LOCAL_REGISTER = API_URL + "/auth/local/register";
//	http://localhost:3000/auth/local/register
export const API_AUTH_LOCAL_LOGIN = API_URL + "/auth/local/login";
//	http://localhost:3000/auth/local/login
export const API_AUTH_42_LOGIN = API_URL + "/auth/42/login";
//	http://localhost:3000/auth/42/login
export const API_AUTH_VALIDATE_2FA_CODE = API_URL + "/auth/2fa/authenticate";
//	http://localhost:3000/auth/2fa/authenticate
export const API_AUTH_DISABLE_2FA = API_URL + "/auth/2fa/disable";
//	http://localhost:3000/auth/2fa/disable
export const API_AUTH_SETUP_2FA = API_URL + "/auth/2fa/setup";
//	http://localhost:3000/auth/2fa/setup
export const API_AUTH_ENABLE_2FA = API_URL + "/auth/2fa/enable";
//	http://localhost:3000/auth/2fa/enable

/*
**	MATCHES_ON_GOING
*/
export const API_MATCHES_PLAYER_LEAVING = API_URL + "/matchesOnGoing/playerLeaving";
// http://localhost:3000/matchesOnGoing/playerLeaving


/*
**  MATCHES
*/
export const API_MATCH_HISTORY = API_URL + "/matches/getMatchHistory";
// http://localhost:3000/matches/getMatchHistory


/*
**	CHAT
*/
export const API_GET_LIST_CHAT = API_URL + "/chat/getListChat";
//	http://localhost:3000/chat/getListChat
export const API_SUSCRIBE_CHAT = API_URL + "/chat/suscribeChat";
//	http://localhost:3000/chat/suscribeChat

/*
**	RELATIONSHIPS
*/
export const API_GET_ALL_RELATIONSHIPS = API_URL + "/relationships/getAllRelationships";
//	http://localhost:3000/relationships/getAllRelationships
export const API_GET_FRIENDSHIPS = API_URL + "/relationships/getFriends";
//	http://localhost:3000/relationships/getFriends
export const API_ADD_FRIEND = API_URL + "/relationships";
//	http://localhost:3000/relationships
export const API_BLOCK_USER = API_URL + "/relationships/blockUser";
//	http://localhost:3000/relationships/blockUser
export const API_UNBLOCK_USER = API_URL + "/relationships/unblockUser";
//	http://localhost:3000/relationships/unblockUser
export const API_UNFRIEND_USER = API_URL + "/relationships/unfriendUser";
//	http://localhost:3000/relationships/unfriendUser
