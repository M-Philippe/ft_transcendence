import { userAction, userState } from './userSliceTypes';
import * as actionType from './userSliceActionTypes';

const initialState: userState = {
  username: "",
  idUser: -1,
  avatar: "",
  isConnected: false,
  isInGame: false,
  idGame: -1,
};

function userReducer(state: userState = initialState, action: userAction) : userState {
  //console.log("ACTION: ", action.type, "\nSTATE: ", action.user);
  switch (action.type) {
    case actionType.CONNECTION_SERVER_APPROVED:
      return {
        ...state,
        idUser: action.user.idUser,
        username: action.user.username,
        avatar: action.user.avatar,
        isConnected: true,
      };
    case actionType.UPDATE_AVATAR:
      return {...state, avatar: action.user.avatar};
    case actionType.UPDATE_USERNAME:
      return {...state, username: action.user.username};
    case actionType.DISCONNECT_USER:
      return {
        ...state,
        username: "",
        idUser: -1,
        avatar: "",
        isConnected: false};
    case actionType.SET_USER_INGAME:
      return {...state, isInGame: true};
    case actionType.UNSET_USER_INGAME:
      return {...state, isInGame: false};
    case actionType.SET_ID_GAME:
      return {...state, idGame: action.user.idGame};
    default:
      return state;
  }
}

export default userReducer;
