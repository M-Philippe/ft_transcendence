import { userState } from "./userSlice/userSliceTypes";

export type storeState = {
  user: userState;
}

export type storeAction = {
  type: string;
  user: userState;
}

export type DispatchType = (args: storeAction) => storeAction;
