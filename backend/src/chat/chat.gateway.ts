import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { ChatService } from "./chat.service";
import { UsersService } from "src/users/users.service";
import { Server, Socket } from "socket.io";
import { IMessage, FetchMessages} from "./chat.interface";
import { getIndexUser } from "./utils/chat.usersInfos.utils";
import { isUserBanned } from "./utils/chat.userBanned.utils";
import { Chat } from "./entities/chat.entity";
import { User } from "src/users/entities/user.entity";
import { isPasswordEmpty } from "./utils/chat.password.utils";
import { forwardRef, Inject, UseGuards } from "@nestjs/common";
import { extractJwtFromCookie, JwtGatewayGuard } from "src/guards/jwtGateway.guards";
import { JwtAuthService } from "src/auth/jwt/jwt-auth.service";
import { IncomingHttpHeaders } from "http";

@WebSocketGateway({ path: "/chat/chatSocket", transports: ['websocket'] })
export class ChatGateway {
  constructor(@Inject(forwardRef(() => ChatService)) private readonly chatService: ChatService,
              @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
              private jwtService: JwtAuthService) {}

  @WebSocketServer()
  server: Server;

  /*
  **    COMMANDS
  */

  async commandInvite(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 2)
          return;
    let response;
    try {
      response = await this.chatService.inviteUserIntoChat(command[1], idChat, idUser);
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else {
      this.server.to(response.socket).emit("newChat", {
        newChatId: response.chat.id,
        name: response.chat.roomName,
      });
      this.server.to(response.socket).emit("receivedMessages", {
        usernames: response.chat.usernames,
        messages: response.chat.messages,
        timeMessages: response.chat.timeMessages,
        chatRefreshed: response.chat.id,
      });
      await this.sendToAllSocketsIntoChat(response.chat);
    }
  }

  async commandBan(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 2) {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: "Invalid number of arguments"
      });
      return;
    }
    let response;
    try {
      response = await this.chatService.kickUserFromChat(command[1], idChat, idUser)
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else {
      this.server.to(response.socket).emit("removeChat", {
        oldIdChat: idChat === 1 ? -1 : idChat,
        newMessages: response.transitionChat.messages,
        newTimeMessages: response.transitionChat.timeMessages,
        newUsernames: response.transitionChat.usernames,
        newChatId: response.transitionChat.id,
      });
      await this.sendToAllSocketsIntoChat(response.chat);
    }
  }

  async commandBanWithTimer(command: string[], idChat: number, idUser: number, socketId: string) {
    let response;
    let timer: number | string;

    timer = this.secureWithBoundsParseInt(command[2]);
    if (typeof(timer) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: timer,
      });
      return;
    }
    try {
      response = await this.chatService.kickUserFromChatWithTimer(command[1], idChat, idUser, timer)
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else {
      setTimeout(async () => {
          let response;
          try {
            response = await this.chatService.unkickUserFromChat(command[1], idChat, idUser);
          } catch (error) {
            return;
          }
          if (response === undefined || typeof(response) === "string")
            return;
          this.server.to(response.socket).emit("newChat", {
            newChatId: response.chat.id,
            name: response.chat.roomName,
          });
          await this.sendToAllSocketsIntoChat(response.chat);
        }, timer * 1000);
      this.server.to(response.socket).emit("removeChat", {
        oldIdChat: idChat === 1 ? -1 : idChat,
        newMessages: response.transitionChat.usernames,
        newTimeMessages: response.transitionChat.timeMessages,
        newUsernames: response.transitionChat.usernames,
        newChatId: response.transitionChat.id,
      });
      await this.sendToAllSocketsIntoChat(response.chat);
    }
  }

  async commandUnban(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length !== 2)
      return;
    let response; try {
      response = await this.chatService.unkickUserFromChat(command[1], idChat, idUser);
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else {
      this.server.to(response.socket).emit("newChat", {
        newChatId: response.chat.id,
        name: response.chat.roomName,
      });
      await this.sendToAllSocketsIntoChat(response.chat);
    }
  }

  async commandMute(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 2)
      return;
    let response;
    try {
      response = await this.chatService.muteUserFromChat(command[1], idChat, idUser);
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else
      await this.sendToAllSocketsIntoChat(response);
  }

  secureWithBoundsParseInt(numberAsString: string) {
    if (numberAsString[0] === '0')
      return ("You can't start your timer with a 0!");
    if (/^[0-9]+$/.test(numberAsString)) {
      let number = parseInt(numberAsString, 10);
      if (number === NaN || number === Infinity)
        return ("Invalid number!");
      else if (number < 30 || number > 300)
        return ("The range for a timer is only 30 to 300 seconds [30-300]");
      return (number);
    }
    return ("Your timer must have only number!");
  }

  async commandMuteWithTimer(command: string[], idChat: number, idUser: number, socketId: string) {
    let response;
    let timer ;
    timer = this.secureWithBoundsParseInt(command[2]);
    if (typeof(timer) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: timer,
      });
      return;
    }
    try {
      response = await this.chatService.muteUserFromChatWithTimer(command[1], idChat, idUser, timer)
    } catch(error) {
      console.error(error);
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else
      await this.sendToAllSocketsIntoChat(response);
  }

  async commandUnmute(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 2)
      return;
    let response;
    try {
      response = await this.chatService.unmuteUserFromChat(command[1], idChat, idUser);
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else
      await this.sendToAllSocketsIntoChat(response);
  }

  async commandSetChatPublic(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 1)
      return;
    let response;
    try {
      response = await this.chatService.setChatToPublic(idChat, idUser);
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else
      this.sendToAllSocketsIntoChat(response);
  }

  async commandSetChatPrivate(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 1)
      return;
    let response; try {
      response = await this.chatService.setChatToPrivate(idChat, idUser);
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    }
    else
      await this.sendToAllSocketsIntoChat(response);
  }

  async commandSetChatName(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 2) {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: "Bad number of arguments."
      });
      return;
    }
    if (command[1].length > 8 || command[1].length < 3) {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: "Bad name's size. 3 < size < 8"
      });
      return;
    }
    let response; try {
      response = await this.chatService.setChatName(idChat, idUser, command[1]);
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    }
    else {
      for (let i = 0; i < response.usersInfos.length; i++) {
        this.server.to(response.usersInfos[i].socket).emit("updateChatName", {
          id: response.id,
          name: response.roomName
        });
      }
    }
  }

  async commandSetPassword(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 2)
      return;
    let response;
    try {
      response = await this.chatService.setPassword(idChat, idUser, command[1]);
    } catch (error) {
      console.error(error);
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    }
    else
      await this.sendToAllSocketsIntoChat(response);
  }

  async commandUnsetPassword(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 1)
      return;
    let response;
    try {
      response = await this.chatService.unsetPassword(idChat, idUser);
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    }
    else
      await this.sendToAllSocketsIntoChat(response);
  }

  async commandQuit(command: string[], idChat: number, idUser: number) {
    if (command.length != 1)
      return;
    let arraySocketsToEmit = await this.chatService.quitChat(idChat, idUser);
    if (arraySocketsToEmit === undefined)
      return;
    for (let i = 0; i < arraySocketsToEmit.length; i++) {
      this.server.to(arraySocketsToEmit[i].socket).emit("removeChat", {
        oldIdChat: idChat,
        newMessages: arraySocketsToEmit[i].newChat.messages,
        newTimeMessages: arraySocketsToEmit[i].newChat.timeMessages,
        newUsernames: arraySocketsToEmit[i].newChat.usernames,
        newChatId: arraySocketsToEmit[i].newChat.id,
      });
    }
    if (!arraySocketsToEmit[0].finalUser)
      await this.sendToAllSocketsIntoChat(arraySocketsToEmit[0].oldChat);
  }

  async commandMp(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length != 2)
      return;
    let response;
    try {
      response = await this.chatService.createPrivateMessage(command[1], idChat, idUser);
    } catch (error) {
      console.error(error);
      return;
    }
    if (response === undefined)
      return;
    else if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else {
      this.server.to(response.socketOne).emit("newChat", {
        newChatId: response.chat.id,
        name: response.chat.roomName
      });
      this.server.to(response.socketTwo).emit("newChat", {
        newChatId: response.chat.id,
        name: response.chat.roomName
      });
    }
  }

  async commandAddAdmin(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length !== 2) {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: "Needs 1 arguments"
      });
    }
    let response;
    try {
      response = await this.chatService.commandAddAdmin(idChat, idUser, command[1]);
    } catch (error) {
      console.error(error);
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: "Internal Server Error, please retry later."
      });
      return;
    }
    if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else
      this.sendToAllSocketsIntoChat(response);
  }

  async commandRemoveAdmin(command: string[], idChat: number, idUser: number, socketId: string) {
    if (command.length !== 2) {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: "Needs 1 arguments"
      });
    }
    let response;
    try {
      response = await this.chatService.commandRemoveAdmin(idChat, idUser, command[1]);
    } catch (error) {
      console.error(error);
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: "Internal Server Error, please retry later."
      });
      return;
    }
    if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response,
      });
    } else
      this.sendToAllSocketsIntoChat(response);
  }

  async commandGameOptions(command: string[], idChat: number, idUser: number, socketId: string, redirect: boolean) {
    if (command.length !== 2) {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: "Needs 1 arguments"
      });
    }
    let response;
    try {
      response = await this.chatService.commandGameOptions(idChat, idUser, command[1], redirect);
    } catch (error) {
      console.error(error);
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: "Internal Server Error, please retry later."
      });
      return;
    }
    if (typeof(response) === "string") {
      this.server.to(socketId).emit("errorMessage", {
        errorMessage: response
      });
      return;
    }
    if (redirect) {
      console.error("HAS SEND REDIRECTION");
      this.server.to(socketId).emit("redirectToInviteProfile", {
        usernameToRedirect: command[1]
      });
    }
  }

  async wrapperCommand(command: string, idChat: number, idUser: number, socketId: string) {
    // add more than one space?
    const arrayCommand = command.split(" ");
    switch (arrayCommand[0]) {
      case "/invite":
        await this.commandInvite(arrayCommand, idChat, idUser, socketId);
        break;
      case "/ban":
        if (arrayCommand.length === 2)
          await this.commandBan(arrayCommand, idChat, idUser, socketId);
        else if (arrayCommand.length === 3)
          await this.commandBanWithTimer(arrayCommand, idChat, idUser, socketId);
        else
          this.server.to(socketId).emit("errorMessage", {
            errorMessage: "Bad commands"
          });
        break;
      case "/unban":
        await this.commandUnban(arrayCommand, idChat, idUser, socketId);
        break;
      case "/mute":
        if (arrayCommand.length === 2)
          await this.commandMute(arrayCommand, idChat, idUser, socketId);
        else if (arrayCommand.length === 3)
          await this.commandMuteWithTimer(arrayCommand, idChat, idUser, socketId);
        else
          this.server.to(socketId).emit("errorMessage", {
            errorMessage: "Bad arguments"
          });
        break;
      case "/unmute":
        await this.commandUnmute(arrayCommand, idChat, idUser, socketId);
        break;
      case "/setChatPublic":
        await this.commandSetChatPublic(arrayCommand, idChat, idUser, socketId);
        break;
      case "/setChatPrivate":
        await this.commandSetChatPrivate(arrayCommand, idChat, idUser, socketId);
        break;
      case "/setChatName":
        await this.commandSetChatName(arrayCommand, idChat, idUser, socketId);
        break;
      case "/setPassword":
        await this.commandSetPassword(arrayCommand, idChat, idUser, socketId);
        break;
      case "/unsetPassword":
        await this.commandUnsetPassword(arrayCommand, idChat, idUser, socketId);
        break;
      case "/quit":
        await this.commandQuit(arrayCommand, idChat, idUser);
        break;
      case "/mp":
        await this.commandMp(arrayCommand, idChat, idUser, socketId);
        break;
      case "/addAdmin":
        await this.commandAddAdmin(arrayCommand, idChat, idUser, socketId);
        break;
      case "/removeAdmin":
        await this.commandRemoveAdmin(arrayCommand, idChat, idUser, socketId);
        break;
      case "/game":
        await this.commandGameOptions(arrayCommand, idChat, idUser, socketId, false);
        break;
      case "/gameOptions":
        await this.commandGameOptions(arrayCommand, idChat, idUser, socketId, true);
        break;
      default:
        this.server.to(socketId).emit("errorMessage", {
          errorMessage: arrayCommand[0] + " isn't a valid command",
        });
        break;
    }
  }

  /*
  **    MESSAGES
  */
  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage('postMessage')
  async postMessage(
  @MessageBody() data: IMessage,
  @ConnectedSocket() socket: Socket) {
    let idUser: number;

    if ((idUser = this.extractIdUserFromCookie(socket.handshake.headers)) < 0)
      return;

    const dateStart = new Date();
    if (data.message.length === 0)
      return;
    if (data.message[0] === "/") {
      this.wrapperCommand(data.message, data.id, idUser, socket.id);
      return;
    }
    let user;
    let chat;
    try {
      user = await this.usersService.findOneByName(data.username);
    } catch (error) {
      console.error(error);
      return;
    }
    try {
      chat = await this.chatService.pushMessage(data, user, socket.id);
    } catch (error) {
      console.error(error);
    }
    if (chat === undefined) {
      return;
    }
    await this.sendToAllSocketsIntoChat(chat);
    const dateEnd = new Date();
    //console.error("TIME: ", dateEnd.valueOf() - dateStart.valueOf());
  }

  async sendToAllSocketsIntoChat(chat: Chat) {
    for (let i = 0; i < chat.usersInfos.length; i++) {
      let tmpSocket = chat.usersInfos[i].socket;
      if (chat.id === 1 && isUserBanned(chat.bannedUsers, chat.usersInfos[i].userId)) {
        let tmpChat = new Chat();
        tmpChat.id = chat.id;
        tmpChat.usernames = [];
        tmpChat.timeMessages = [];
        tmpChat.messages = [];
        tmpChat.usernames = ["System"];
        tmpChat.timeMessages = ["01:23:45"];
        tmpChat.messages = ["You're not allowed here"];
        this.server.to(tmpSocket).emit("receivedMessages", {
          usernames: tmpChat.usernames,
          messages: tmpChat.messages,
          timeMessages: tmpChat.timeMessages,
          chatRefreshed: tmpChat.id,
        });
      }
      if (isUserBanned(chat.bannedUsers, chat.usersInfos[i].userId)) {
        continue;
      }
      else if (!isPasswordEmpty(chat.password) && chat.usersInfos[i].hasProvidedPassword === false) {
        let tmpChat = new Chat();
        tmpChat.id = chat.id;
        tmpChat.usernames = [];
        tmpChat.timeMessages = [];
        tmpChat.messages = [];
        tmpChat.usernames = ["System"];
        tmpChat.timeMessages = ["01:23:45"];
        tmpChat.messages = ["You must enter a password to enter this chat"];
        this.server.to(tmpSocket).emit("receivedMessages", {
          usernames: tmpChat.usernames,
          messages: tmpChat.messages,
          timeMessages: tmpChat.timeMessages,
          chatRefreshed: tmpChat.id,
        });
      }
      else if (chat.usersInfos[i].persoMutedUsers.length != 0) {
        let persoUser;
        persoUser = await this.usersService.findOne(chat.usersInfos[i].userId);
        let splicedChat = await this.removedPersoMuted(chat, persoUser);
        if (splicedChat === undefined)
          break;
        this.server.to(tmpSocket).emit("receivedMessages", {
          usernames: splicedChat.usernames,
          messages: splicedChat.messages,
          timeMessages: splicedChat.timeMessages,
          chatRefreshed: chat.id,
        });
      } else {
        this.server.to(tmpSocket).emit("receivedMessages", {
          usernames: chat.usernames,
          messages: chat.messages,
          timeMessages: chat.timeMessages,
          chatRefreshed: chat.id,
        });
      }
    }
  }

  async sendToOneSocketIntoChat(chat: Chat, socket: Socket, userId: number) {
    let index = getIndexUser(chat.usersInfos, userId);
    if (index < 0)
      return;
    if (isUserBanned(chat.bannedUsers, chat.usersInfos[index].userId))
      return;
    else if (!isPasswordEmpty(chat.password) && chat.usersInfos[index].hasProvidedPassword === false) {
      let tmpChat = new Chat();
      tmpChat.id = chat.id;
      tmpChat.usernames = [];
      tmpChat.timeMessages = [];
      tmpChat.messages = [];
      tmpChat.usernames = ["System"];
      tmpChat.timeMessages = ["01:23:45"];
      tmpChat.messages = ["You must enter a password to enter this chat"];
      socket.emit("receivedMessages", {
        usernames: tmpChat.usernames,
        messages: tmpChat.messages,
        timeMessages: tmpChat.timeMessages,
        chatRefreshed: tmpChat.id,
      });
    }
    else if (chat.usersInfos[index].persoMutedUsers.length != 0) {
      let persoUser;
      persoUser = await this.usersService.findOne(chat.usersInfos[index].userId);
      let splicedChat = await this.removedPersoMuted(chat, persoUser);
      if (splicedChat === undefined)
        return;
      socket.emit("receivedMessages", {
        usernames: splicedChat.usernames,
        messages: splicedChat.messages,
        timeMessages: splicedChat.timeMessages,
        chatRefreshed: chat.id,
      });
      } else {
        socket.emit("receivedMessages", {
          usernames: chat.usernames,
          messages: chat.messages,
          timeMessages: chat.timeMessages,
          chatRefreshed: chat.id,
        });
      }
  }

  async removedPersoMuted(chat: Chat, user: User) {
    let mutedPerso: number[] = [];
    let newChat: Chat = new Chat();
    newChat.id = chat.id;
    newChat.messages = [];
    newChat.timeMessages = [];
    newChat.usernames = [];
    for (let i = 0; i < chat.messages.length; i++) {
      newChat.messages[i] = chat.messages[i];
      newChat.timeMessages[i] = chat.timeMessages[i];
      newChat.usernames[i] = chat.usernames[i];
    }
    mutedPerso = chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].persoMutedUsers;
    let usernamesToRemove: string[] = [];
    for (let i = 0; i < mutedPerso.length; i++) {
      let tmpUser;
      for (let i = 0; i < mutedPerso.length; i++) {
        try {
          tmpUser = await this.usersService.findOne(mutedPerso[i]);
        } catch (error) {
        }
        if (tmpUser === undefined)
          return;
        usernamesToRemove.push(tmpUser.name);
      }
      for (let i = 0; i < chat.usernames.length; i++) {
        for (let j = 0; j < usernamesToRemove.length; j++) {
          if (newChat.usernames[i] === usernamesToRemove[j]) {
            newChat.messages.splice(i, 1);
            newChat.timeMessages.splice(i, 1);
            newChat.usernames.splice(i, 1);
            i--;
          }
        }
      }
    }
    return (newChat);
  }

  extractIdUserFromCookie(headers: IncomingHttpHeaders) : number {
    let idUser = -1;
    let payload: any;
    let jwt;

    if (headers.cookie === undefined)
      return (idUser);
    jwt = extractJwtFromCookie(headers.cookie);
    try {
      payload = this.jwtService.verify(jwt);
      if (payload.idUser !== undefined)
        idUser = payload.idUser;
    } catch (error) {}
    return (idUser);
  }

  async handleConnection(client: any, ...args: any[]) {
    let payload;
    if (client.handshake.headers.cookie) {
			let jwt = extractJwtFromCookie(client.handshake.headers.cookie);
			if (jwt === "")
				return;
			try {
				payload = this.jwtService.verify(jwt);
			} catch (error) { return; }
    } else
      return;
    /* Propagate socket to all chat with user in it. */
    let user: User;
    let idUser: number = payload.idUser;
    let arrayIds = await this.chatService.propagateSocketInChat(idUser, client.id);
    this.server.to(client.id).emit("receiveListChat", {lstId: arrayIds});
  }


  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage('fetchMessages')
  async fetchMessagesGateway(
  @MessageBody() data: FetchMessages,
  @ConnectedSocket() socket: Socket) {
    let chat;
    let tmpChat;
    let idUser: number;
    console.error("FETCHED");
    if ((idUser = this.extractIdUserFromCookie(socket.handshake.headers)) < 0)
      return;
    try {
      chat = await this.chatService.findOne(data.chatId)
    } catch (error) {
      throw new Error ("No Chat");
    }
    let user;
    try {
      user = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error("No User");
    }
    if (isUserBanned(chat.bannedUsers, idUser)) {
      socket.emit("receivedMessages", {
        chatRefreshed: chat.id,
        messages: ["You're not allowed here."],
        usernames: ["Admin"],
        timeMessages: [this.chatService.getTimestamp()]
      });
      return;
    }
    socket.emit("receivedMessages", {
      chatRefreshed: chat.id,
      messages: chat.messages,
      usernames: chat.usernames,
      timeMessages: chat.timeMessages
    });
    //socket.emit("newChat", {
    //  newChatId: chat.id,
    //});
  }

  /*
  **    CHAT
  */

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage('createChat')
  async createChat(
  @MessageBody("nameUser") nameUser: string,
  @ConnectedSocket() socket: Socket) {
    let idUser: number;

    if ((idUser = this.extractIdUserFromCookie(socket.handshake.headers)) < 0)
      return;
    try {
      const response = await this.chatService.createChat(idUser, socket.id);
      socket.join(response.roomName);
      socket.emit("newChat", {
        newChatId: response.id,
        name: response.roomName
      });
    } catch (error) {
      socket.emit("ERROR", {
        description: "Can't create: ",
        errorMsg: error.message,
      })
    }
  }

  async sendNewChatToSocketFromController(data: any) {
    this.server.to(data.socket).emit("newChat", {
      newChatId: data.chatToSend.id,
      name: data.chatToSend.roomName,
    });
  }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage("getListChat")
  async getListChat(
    @ConnectedSocket() socket: Socket) {
      console.error("GET_LIST_CHAT");
      let idUser: number;  
      if ((idUser = this.extractIdUserFromCookie(socket.handshake.headers)) < 0) {
        console.error("NO COOKIES");
        return;
      }
      let user;
      try {
        user = await this.usersService.findOne(idUser);
      } catch (error) {
        console.error("NO SUCH USER");
        return;
      }
      let ret: {id: number, name: string}[] = [];
      for (let i = 0; i < user.listChat.length; i++)
        ret.push({ id: user.listChat[i].id, name: user.listChat[i].roomName });
      if (ret.length === 0)
        return;
      this.server.to(socket.id).emit("receivedListChat", {lstId: ret});
    }

  @UseGuards(JwtGatewayGuard)
  @SubscribeMessage("getAvatar")
  async getAvatar(
    @MessageBody() data: {username: string, key: number},
    @ConnectedSocket() socket: Socket,
  ) {
    let user;
    try {
      user = await this.usersService.findOneByName(data.username);
    } catch (error) { return; }
    this.server.to(socket.id).emit("receivedAvatar" + data.key, {
      avatar: user.avatar,
    });
  }
}
