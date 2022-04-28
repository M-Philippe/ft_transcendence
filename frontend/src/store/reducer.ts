import { combineReducers } from 'redux';
import userReducer from './userSlice/userSlice';

export default combineReducers({
  user: userReducer,
});