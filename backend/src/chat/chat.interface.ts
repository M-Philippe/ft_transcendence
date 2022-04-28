import { Chat } from "./entities/chat.entity";

export interface IMessage {
  id: number,
  username: string,
  message: string,
}

export interface FetchMessages {
  chatId: number,
  username: string,
}

export interface SocketUsers {
  userId: number,
  socket: string,
}

export interface MessagesRooms {
  idChat: number,
  messages: string[],
  timeMessages: string[],
  usernames: string[],
}

export interface Muted {
  userId: number,
  dateMute: number,
  timer: number,
}

export interface Banned {
  userId: number,
  dateBan: number,
  timer: number,
}

export interface Users {
  userId: number,
  hasProvidedPassword: boolean,
  persoMutedUsers: number[],
  socket: string,
}

export interface SocketToEmit {
  oldChat: Chat,
  newChat: Chat,
  socket: string,
  finalUser: boolean,
}
