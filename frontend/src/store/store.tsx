import rootReducer from "./reducer";
import { createStore, Store } from 'redux';
import {DispatchType} from './types';
import { saveState, loadState } from './persistentState';
import { UNSET_USER_INGAME } from "./userSlice/userSliceActionTypes";

const persistentStore = loadState();
const store: Store<any> & {dispatch: DispatchType} = createStore(rootReducer, persistentStore);
store.subscribe(() => {
  saveState(store.getState());
})

store.dispatch({
  type: UNSET_USER_INGAME,
  user: store.getState().user,
});

export default store;
