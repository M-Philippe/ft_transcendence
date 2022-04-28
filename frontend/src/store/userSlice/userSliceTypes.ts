export type userState = {
  username: string;
  avatar: string;
  idUser: number;
  isConnected: boolean;
  isInGame: boolean;
  idGame: number;
}

export type userAction = {
  type: string;
  user: userState;
}
