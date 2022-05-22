import { forwardRef, HttpCode, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { getConnection, Repository } from "typeorm";
import { Chat } from "./entities/chat.entity";
import { CreateChatDto } from "./dto/create-chat";
import { IMessage, SocketToEmit } from "./chat.interface";
import { UsersService } from "src/users/users.service";
import { User } from '../users/entities/user.entity';
import { isUserMuted, getIndexMutedUser } from './utils/chat.userMuted.utils';
import { isUserBanned, getIndexBannedUser } from './utils/chat.userBanned.utils';
import { getIndexUser, isUserPresent } from "./utils/chat.usersInfos.utils";
import { isPasswordEmpty } from "./utils/chat.password.utils";
import { comparePassword, encryptPasswordToStoreInDb } from "src/passwordEncryption/passwordEncryption";
import { BANNED_MESSAGE, INVITE_MESSAGE, JOINED_MESSAGE, LACK_ADMIN_RIGHT, LACK_OWNER_RIGHT, MUTED_MESSAGE, QUIT_MESSAGE, RESOLVED_PASSWORD, SET_CHAT_PRIVATE, SET_CHAT_PUBLIC, SET_PASSWORD, UNBANNED_MESSAGE, UNMUTED_MESSAGE, UNSET_PASSWORD } from "./chat.constMessages";
import { ChatGateway } from "./chat.gateway";
import { RelationshipsService } from "src/relationships/relationships.service";
import { RelationshipStatus } from "src/relationships/entities/relationship.entity";

function getTimestamp() : string {
  let time = new Date();
  let timeString = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
  return (timeString);
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
    @Inject(forwardRef(() => ChatGateway)) private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => RelationshipsService)) private readonly relationshipsService: RelationshipsService
  ) {}

  async onApplicationBootstrap() {
    // We create global [id: 0]
    // TODO -> Do nothing if chat 0 already exists.
    const checkChatGlobalExist = await this.chatRepository.findOne(1);
    if (checkChatGlobalExist !== undefined)
      return;
    const chat = this.chatRepository.create({});
    chat.usernames = [];
    chat.usernames.push("Admin");
    chat.timeMessages = [];
    chat.timeMessages.push(getTimestamp());
    chat.messages = [];
    chat.messages.push("Chat was created");
    chat.usersInChat = [];
    chat.roomName = "global";
    // put superAdmin in owner.
    chat.owners = [];
    chat.admins = [];
    chat.usersInfos = [];
    chat.bannedUsers = [];
    chat.mutedUsers = [];
    chat.type = "public";
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      // Error handler
    }
    return chat;
  }

  async getListPublicChat(idUser: number) {
    let response: Array<any> = [];
    let arrayChat = await this.findAll();
    if(arrayChat === undefined)
      return;
    for (let i = 0; i < arrayChat.length; i++) {
      if (arrayChat[i].type === "public" && !isUserPresent(arrayChat[i].usersInfos, idUser) && !isUserBanned(arrayChat[i].bannedUsers, idUser)) {
        response.push({
          chatName: arrayChat[i].roomName,
          idChat: arrayChat[i].id,
        });
      }
    }
    return (response);
  }

  async addMessageInArray(chat: Chat, username: string, message: string) {
    chat.timeMessages.push(getTimestamp());
    chat.messages.push(message);
    chat.usernames.push(username);
    return (chat);
  }

  async propagateMute(userWhoMute: User, userToMute: User) {
    for (let i = 0; i < userWhoMute.listChat.length; i++) {
      if (
        (userWhoMute.listChat[i].usersInfos[getIndexUser(userWhoMute.listChat[i].usersInfos, userWhoMute.id)].persoMutedUsers.find(o => o === userWhoMute.id) === undefined)
        && (userWhoMute.listChat[i].admins.find(o => o === userToMute.id) === undefined)) {
          userWhoMute.listChat[i].usersInfos[getIndexUser(userWhoMute.listChat[i].usersInfos, userWhoMute.id)].persoMutedUsers.push(userToMute.id);
        try {
          await this.chatRepository.save(userWhoMute.listChat[i]);
        } catch (error) {
          return;
        }
        console.error("PROPAGATED");
      }
    }
  }

  async classicUserMuteCommand(chat: Chat, user: User, userToMute: User) {
    chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].persoMutedUsers.push(userToMute.id);
    if (chat.admins.indexOf(userToMute.id) >= 0)
      return;
    // propagateToAllChat.
    this.propagateMute(user, userToMute);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  async classicUserUnmuteCommand(chat: Chat, user: User, userToUnmute: User) {
    let index = chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].persoMutedUsers.indexOf(userToUnmute.id);
    if (!isUserPresent(chat.usersInfos, userToUnmute.id)
    || isUserBanned(chat.bannedUsers, userToUnmute.id)
    || index < 0)
      return ("User not in chat, not muted or already banned");
    chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].persoMutedUsers.splice(index, 1);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  async muteUserFromChat(userToMute: string, idChat: number, idUser: number) {
    let adminUser;
    let mutedUser;
    let chat;

    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    if (chat === undefined)
      return undefined;
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    try {
      mutedUser = await this.usersService.findOneByName(userToMute);
    } catch (error) {
      return ("No user named '" + userToMute + "'");
    }
    // Classic Mute
    if (chat.admins.indexOf(adminUser.id) < 0) {
      chat = await this.classicUserMuteCommand(chat, adminUser, mutedUser);
      return undefined;
    }
    if (!isUserPresent(chat.usersInfos, mutedUser.id)
    || isUserBanned(chat.bannedUsers, mutedUser.id)
    || isUserMuted(chat.mutedUsers, mutedUser.id))
      return ("User not in chat or already banned/muted");
    chat.mutedUsers.push({
      userId: mutedUser.id,
      dateMute: 0,
      timer: 0,
    });
    if ((chat = await this.addMessageInArray(chat, "System [" + adminUser.name + "]", MUTED_MESSAGE + " " + mutedUser.name)) === undefined)
      return undefined;
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  async unmuteUserFromChat(userToMute: string, idChat: number, idUser: number) {
    let adminUser;
    let mutedUser;
    let chat;

    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    if (chat === undefined)
      return undefined;
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    try {
      mutedUser = await this.usersService.findOneByName(userToMute);
    } catch (error) {
      return ("No user named '" + userToMute + "'");
    }
    if (chat.admins.indexOf(adminUser.id) < 0) {
      chat = await this.classicUserUnmuteCommand(chat, adminUser, mutedUser);
      return (chat);
    }
    if (!isUserPresent(chat.usersInfos, mutedUser.id)
    || isUserBanned(chat.bannedUsers, mutedUser.id)
    || !isUserMuted(chat.mutedUsers, mutedUser.id))
      return ("User not in chat / already banned / not muted");
    chat.mutedUsers.splice(getIndexMutedUser(chat.mutedUsers, mutedUser.id), 1);
    if ((chat = await this.addMessageInArray(chat, "System [" + adminUser.name + "]", UNMUTED_MESSAGE + " " + mutedUser.name)) === undefined)
      return undefined;
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  async automaticUnmuteUserFromChat(mutedUser: User, chat: Chat) : Promise<boolean> {
    if (!isUserPresent(chat.usersInfos, mutedUser.id)
    || isUserBanned(chat.bannedUsers, mutedUser.id)
    || !isUserMuted(chat.mutedUsers, mutedUser.id))
      return false;
    chat.mutedUsers.splice(getIndexMutedUser(chat.mutedUsers, mutedUser.id), 1);
    if ((chat = await this.addMessageInArray(chat, "System", UNMUTED_MESSAGE + " " + mutedUser.name)) === undefined)
      return false;
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (true);
  }

  async muteUserFromChatWithTimer(userToMute: string, idChat: number, idUser: number, timer: number) {
    let adminUser;
    let mutedUser;
    let chat;
    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    if (chat === undefined)
      return undefined;
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    if (chat.admins.indexOf(adminUser.id) < 0)
      return (LACK_ADMIN_RIGHT);
    try {
      mutedUser = await this.usersService.findOneByName(userToMute);
    } catch (error) {
      return ("No user named '" + userToMute + "'");
    }
    if (!isUserPresent(chat.usersInfos, mutedUser.id)
    || isUserMuted(chat.mutedUsers, mutedUser.id)
    || isUserBanned(chat.bannedUsers, mutedUser.id))
      return ("User not in chat or already muted/banned");
    const date = new Date();
      chat.mutedUsers.push({
      userId: mutedUser.id,
      dateMute: date.valueOf(),
      timer: timer * 1000,
    });
    if ((chat = await this.addMessageInArray(chat, "System [" + adminUser.name + "]", MUTED_MESSAGE + " " + mutedUser.name + " for " + timer.toString())) === undefined)
      return undefined;
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  /*
  **  Check that admin is right
  **  Check that userToBan is in chat
  **  Add userban to Banned[]
  **  Find other chat to return to userToBan
  **    If no other, send custom msg
  */
  async kickUserFromChat(userToBan: string, idChat: number, idUser: number) {
    let adminUser;
    let banishedUser;
    let chat;
    let transitionChat;

    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    try {
      banishedUser = await this.usersService.findOneByName(userToBan);
    } catch (error) {
      return ("No user named '" + userToBan + "'");
    }
    if (chat === undefined)
      return undefined;
    if (chat.admins.indexOf(adminUser.id) < 0)
      return (LACK_ADMIN_RIGHT);
    if (!isUserPresent(chat.usersInfos, banishedUser.id)
    || isUserBanned(chat.bannedUsers, banishedUser.id)) {
      return ("No user named '" + userToBan + "' or already banned");
    }
    chat.bannedUsers.push({
      userId: banishedUser.id,
      dateBan: 0,
      timer: 0,
    });
    this.addMessageInArray(chat, "System [" + adminUser.name + "]", BANNED_MESSAGE + " " + banishedUser.name);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error("Can't save chat: " + error);
    }
    try {
      await this.usersService.removeChat(idChat, banishedUser);
    } catch (error) {
      throw new Error(error);
    }
    let count = 0;
    transitionChat = banishedUser.listChat[count];
    while (isUserBanned(transitionChat.bannedUsers, banishedUser.id) && count < banishedUser.listChat.length)
      transitionChat = banishedUser.listChat[++count];
    // get globalChatf if no chat availaible.
    if (count >= banishedUser.listChat.length)
      transitionChat = banishedUser.listChat[0];
    let socketToEmit = transitionChat.usersInfos[getIndexUser(transitionChat.usersInfos, banishedUser.id)].socket;
    return ({transitionChat: transitionChat, socket: socketToEmit, chat: chat});
  }

  async kickUserFromChatWithTimer(userToBan: string, idChat: number, idUser: number, timer: number) {
    let adminUser;
    let banishedUser;
    let chat;
    let transitionChat;

    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    try {
      banishedUser = await this.usersService.findOneByName(userToBan);
    } catch (error) {
      return ("No user named '" + userToBan + "'");
    }
    if (chat === undefined)
      return undefined;
    if (chat.admins.indexOf(adminUser.id) < 0) {
      return (LACK_ADMIN_RIGHT);
    }
    if (!isUserPresent(chat.usersInfos, banishedUser.id)) {
      return ("'" + banishedUser.name + "' not in this chat");
      return undefined;
    }
    const date = new Date();
    chat.bannedUsers.push({
      userId: banishedUser.id,
      dateBan: date.valueOf(),
      timer: timer,
    });
    this.addMessageInArray(chat, "System [" + adminUser.name + "]", BANNED_MESSAGE + " " + banishedUser.name + " for " + timer.toString());
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error("Can't save chat: " + error);
    }
    try {
      await this.usersService.removeChat(idChat, banishedUser);
    } catch (error) {
      throw new Error(error);
    }
    let count = 0;
    transitionChat = banishedUser.listChat[count];
    while (isUserBanned(transitionChat.bannedUsers, banishedUser.id) && count < banishedUser.listChat.length)
      transitionChat = banishedUser.listChat[++count];
    // get globalChatf if no chat availaible.
    if (count >= banishedUser.listChat.length)
      transitionChat = banishedUser.listChat[0];
    let socketToEmit = chat.usersInfos[getIndexUser(chat.usersInfos, banishedUser.id)].socket;
    return ({transitionChat: transitionChat, socket: socketToEmit, chat: chat});
  }

  async unkickUserFromChat(userToBan: string, idChat: number, idUser: number) {
    let adminUser;
    let banishedUser;
    let chat;

    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    try {
      banishedUser = await this.usersService.findOneByName(userToBan);
    } catch (error) {
      return ("No user '" + userToBan + "'");
    }
    if (chat === undefined)
      return undefined;
    if (chat.admins.indexOf(adminUser.id) < 0)
      return (LACK_ADMIN_RIGHT);
    if (!isUserPresent(chat.usersInfos, banishedUser.id)
    || !isUserBanned(chat.bannedUsers, banishedUser.id)) {
      return ("'" + banishedUser.name + "' is not in chat, or not banned");
    }
    chat.bannedUsers.splice(getIndexBannedUser(chat.bannedUsers, banishedUser.id), 1);
    this.addMessageInArray(chat, "System [" + adminUser.name + "]", UNBANNED_MESSAGE + " " + banishedUser.name);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error("Can't save chat: " + error);
    }
    try {
      await this.usersService.addChat(chat, banishedUser);
    } catch (error) {
      throw new Error(error);
    }
    // For socket as string
    // (in this case we take the one from global because socket could have changed when chat was invisible)
    let globalChat;
    try {
      globalChat = await this.chatRepository.findOne(1);
    } catch (error) {
      throw new Error(error);
    }
    let userIdToFind = banishedUser.id;
    if (globalChat === undefined)
      return undefined;
    let socketToEmit = globalChat.usersInfos.find(o => o.userId === userIdToFind)?.socket;
    if (socketToEmit === undefined)
      return;
    return ({chat: chat, socket: socketToEmit});
  }

  /*
  **  Check that target exist
  **  Get target's socketId from globalChat (1)
  **  Add user in chat
  **  emit to Socket ("newChat")
  */
  async inviteUserIntoChat(usernameToInvite: string, idChat: number, idUser: number) {
    let userToInvite;
    let userInit;
    let chat;
    let globalChat;

    try {
      userInit = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    try {
      userToInvite = await this.usersService.findOneByName(usernameToInvite);
    } catch (error) {
      let ret = "No such user";
      return("No user named '" + usernameToInvite +"'");
    }
    try {
      globalChat = await this.chatRepository.findOne(1);
    } catch (error) {
      throw new Error(error);
    }
    if (globalChat === undefined)
      return undefined;
    if (!isUserPresent(globalChat.usersInfos, userToInvite.id))
      return undefined;
    try {
      chat = await this.chatRepository.findOne(idChat, { relations: ["usersInChat"]});
    } catch (error) {
      throw new Error(error);
    }
    if (chat === undefined)
      return undefined;
    // Check that users isn't already in chat
    if (isUserPresent(chat.usersInfos, userToInvite.id) || isUserBanned(chat.bannedUsers, userToInvite.id)
    || isUserMuted(chat.mutedUsers, userInit.id)) {
      return ("User already in chat, or banned");
    }
    if (chat.usersInChat === undefined)
      chat.usersInChat = [userToInvite];
    else
      chat.usersInChat.push(userToInvite);
    /* PULL SOCKET userToInvite from GlobalChat */
    let userIdToFind = userToInvite.id;
    let socketToEmit = globalChat.usersInfos.find(o => o.userId === userIdToFind);
    if (socketToEmit === undefined)
      return;
    chat.usersInfos.push({
      userId: userToInvite.id,
      hasProvidedPassword: false,
      persoMutedUsers: globalChat.usersInfos[getIndexUser(globalChat.usersInfos, userToInvite.id)].persoMutedUsers,
      socket: socketToEmit.socket,
    });
    this.addMessageInArray(chat, userInit.name, INVITE_MESSAGE + " " + userToInvite.name);
    try {
      this.chatRepository.save(chat);
    } catch (error) {
      throw new Error("Can't save chat: " + error);
    }
    return ({chat: chat, socket: socketToEmit.socket});
  }

  async saveSocketInChat(user: User, socket: string, chat: Chat) {
    if (chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].socket === undefined) {
      try {
        await this.chatRepository.save(chat);
      } catch (error) {
        throw new Error(error);
      }
    }
    if (chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].socket !== socket) {
      chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].socket = socket;
      try {
        await this.chatRepository.save(chat);
      } catch (error) {
        throw new Error(error);
      }
    }
  }

  async suscribeUserToGlobal(user: User, socket: string) {
    let globalChat;

    try {
      globalChat = await this.chatRepository.findOne(1, {relations: ["usersInChat"]});
    } catch (error) {
      throw new Error(error);
    }
    if (globalChat === undefined)
      return undefined;
    if (isUserPresent(globalChat.usersInfos, user.id)) {
      globalChat.usersInChat.push(user);
      if (user.id === 1 && user.name === "sudo" && globalChat.owners.indexOf(1) < 0) {
        globalChat.owners.push(1);
        globalChat.admins.push(1);
      }
      await this.saveSocketInChat(user, socket, globalChat);
      return globalChat;
    }
    globalChat.usersInfos.push({
      userId: user.id,
      hasProvidedPassword: false,
      persoMutedUsers: [],
      socket: socket,
    });
    if (globalChat.usersInChat === undefined) {
      globalChat.usersInChat = [];
    }
    globalChat.usersInChat.push(user);
    globalChat = await this.addMessageInArray(globalChat, user.name, JOINED_MESSAGE);
    try {
      await this.chatRepository.save(globalChat);
    } catch (error) {
      throw new Error(error);
    }
    return (globalChat);
  }

  async updateAllSocketsUser(user: User, socket: string) {
    for (let i = 0; i < user.listChat.length; i++) {
      let idx = user.listChat[i].usersInfos.findIndex(x => x.userId === user.id);
      if (idx === -1)
        continue;
      if (user.listChat[i].usersInfos[idx].socket !== socket) {
      user.listChat[i].usersInfos[idx].socket = socket;
        await getConnection()
              .createQueryBuilder()
              .update(Chat)
              .set({
                usersInfos: user.listChat[i].usersInfos
              })
              .where("id = :id", {id: user.listChat[i].id})
              .execute();
      }
    }
  }

  async setChatToPublic(idChat: number, idUser: number) {
    let chat;
    let adminUser;

    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    if (chat === undefined)
      return;
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    if (adminUser === undefined)
      return;
    if (chat.owners[0] !== adminUser.id)
      return (LACK_OWNER_RIGHT);
    chat.type = "public";
    chat = await this.addMessageInArray(chat, "System [" + adminUser.name + "]", SET_CHAT_PUBLIC);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  async setChatToPrivate(idChat: number, idUser: number) {
    let chat;
    let adminUser;

    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    if (chat === undefined)
      return;
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    if (adminUser === undefined)
      return;
    if (chat.owners[0] !== adminUser.id)
      return (LACK_OWNER_RIGHT);
    chat.type = "private";
    chat = await this.addMessageInArray(chat, "System [" + adminUser.name + "]" + " (System)", SET_CHAT_PRIVATE);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  async setPassword(idChat: number, idUser: number, password: string) {
    let chat;
    let adminUser;

    if (idChat === 1)
      return;
    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    if (chat === undefined)
      return;
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    if (adminUser === undefined)
      return;
    if (chat.owners.indexOf(adminUser.id) < 0)
      return (LACK_OWNER_RIGHT);
    //if (chat.password === undefined)
    //  chat.password = await encryptPasswordToStoreInDb(chat.password, password);
    //else {
      await getConnection()
        .createQueryBuilder()
        .update(Chat)
        .set({
          password: await encryptPasswordToStoreInDb(chat.password, password)
        })
        .where("id = :id", { id: idChat })
        .execute();
    //}
    chat = await this.chatRepository.findOne(idChat);
    if (chat === undefined)
      return;
    chat.usersInfos[getIndexUser(chat.usersInfos, adminUser.id)].hasProvidedPassword = true;
    for (let i = 0; i < chat.usersInfos.length; i++) {
      if (chat.admins.indexOf(chat.usersInfos[i].userId) < 0)
        chat.usersInfos[i].hasProvidedPassword = false;
    }
    chat = await this.addMessageInArray(chat, "System [" + adminUser.name + "]", SET_PASSWORD);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  async unsetPassword(idChat: number, idUser: number) {
    let chat;
    let adminUser;

    if (idChat === 1)
      return;
    try {
      chat = await this.chatRepository.findOne(idChat);
    } catch (error) {
      throw new Error(error);
    }
    if (chat === undefined)
      return;
    try {
      adminUser = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    if (adminUser === undefined)
      return;
    if (chat.owners.indexOf(adminUser.id) < 0)
      return (LACK_OWNER_RIGHT);
    chat.password = undefined;
    chat = await this.addMessageInArray(chat, "System [" + adminUser.name + "]", UNSET_PASSWORD);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    await getConnection()
      .createQueryBuilder()
      .update(Chat)
      .set({
        password: {}
      })
      .where("id = :id", {id: idChat})
      .execute();
    return (chat);
  }

  async deleteChat(chat: Chat) {
    // pull all sockets to emit removeChat on it
    let arraySocketsToEmit: Array<SocketToEmit> = [];
    let transitionChat;
    let tmpUser;
    for (let i = 0; i < chat.usersInfos.length; i++) {
      // find transitionChat
      tmpUser = await this.usersService.findOne(chat.usersInfos[i].userId);
      let count = 0;
      transitionChat = tmpUser.listChat[count];
      while (isUserBanned(transitionChat.bannedUsers, tmpUser.id) && count < tmpUser.listChat.length)
        transitionChat = tmpUser.listChat[++count];
      if (count == tmpUser.listChat.length)
        transitionChat = tmpUser.listChat[0];
      arraySocketsToEmit.push({
        oldChat: chat,
        newChat: transitionChat,
        socket: chat.usersInfos[i].socket,
        finalUser: true,
      });
    }
    try {
      await this.chatRepository.remove(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (arraySocketsToEmit);
  }

  async removePersoFromChat(chat: Chat, user: User) {
    let arraySocketsToEmit: Array<SocketToEmit> = [];

    let count = 0;
    let transitionChat;
    transitionChat = user.listChat[count];
    while (isUserBanned(transitionChat.bannedUsers, user.id) && count < user.listChat.length)
      transitionChat = user.listChat[++count];
    if (count == user.listChat.length)
      transitionChat = user.listChat[0];

    chat = await this.addMessageInArray(chat, user.name, QUIT_MESSAGE);
    arraySocketsToEmit.push({
      oldChat: chat,
      newChat: transitionChat,
      socket: chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].socket,
      finalUser: false,
    });
    chat.usersInfos.splice(getIndexUser(chat.usersInfos, user.id), 1);
    // find index usersInChat
    let i = 0;
    while (i < chat.usersInChat.length) {
      if (chat.usersInChat[i].id == user.id)
        break;
      i++;
    }
    chat.usersInChat.splice(i, 1);
    if (getIndexMutedUser(chat.mutedUsers, user.id) >= 0)
      chat.mutedUsers.splice(getIndexMutedUser(chat.mutedUsers, user.id), 1);
    if (chat.admins.indexOf(user.id) >= 0)
      chat.admins.splice(chat.admins.indexOf(user.id), 1);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (arraySocketsToEmit);
  }

  async quitChat(idChat: number, idUser: number) : Promise<undefined | Array<SocketToEmit>> {
    let user;
    let chat;
    let arraySocketsToEmit;

    if (idChat == 1)
      return undefined;
    try {
      chat = await this.chatRepository.findOne(idChat, {relations: ["usersInChat"]});
    } catch (error) {
      throw new Error(error);
    }
    if (chat === undefined)
      return;
    try {
      user = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    if (user === undefined)
      return (undefined);
    if (user.id === chat.owners[0]) {
      arraySocketsToEmit = await this.deleteChat(chat);
    } else {
      arraySocketsToEmit = await this.removePersoFromChat(chat, user);
    }
    return (arraySocketsToEmit);
  }

  async createChat(idUser: number, socket: string) {
    let user;
    try {
      user = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error("Can't find user: " + error.message);
    }
    let timestamp = getTimestamp();
    const chat = this.chatRepository.create();
    chat.roomName = user.name + timestamp;
    chat.usernames = [user.name];
    chat.timeMessages = [timestamp];
    chat.messages = ["Created this chat"],
    chat.owners = [user.id];
    chat.admins = [user.id];
    chat.bannedUsers = [];
    chat.mutedUsers = [];
    chat.password = undefined;
    chat.usersInfos = [{
      userId: user.id,
      hasProvidedPassword: false,
      persoMutedUsers: [],
      socket: socket,
    }];
    chat.usersInChat = [user];
    chat.type = "private";
    try {
      await this.chatRepository.save(chat);
      return chat;
    } catch (error) {
      throw new Error ("Can't save chat: " + error.message);
    }
  }

  async tryResolvePassword(chat: Chat, user: User, tryPassword: string) {
    let ret;
    if (await comparePassword(chat.password, tryPassword)) {
      chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].hasProvidedPassword = true;
      chat = await this.addMessageInArray(chat, user.name, RESOLVED_PASSWORD);
      try {
        ret = await this.chatRepository.save(chat);
      } catch (error) {
        throw new Error(error);
      }
      return (ret);
    }
    return (undefined);
  }

  async pushMessage(data: IMessage, user: User, socket: string) {
    let chat = await this.chatRepository.findOne(data.id);
    if (!chat)
      throw new Error("no chat");
    await this.saveSocketInChat(user, socket, chat);
    // If passwordProtected take input as a try
    if (!isPasswordEmpty(chat.password) && chat.usersInfos[getIndexUser(chat.usersInfos, user.id)].hasProvidedPassword === false) {
      chat = await this.tryResolvePassword(chat, user, data.message);
      return chat;
    }
    if (isUserMuted(chat.mutedUsers, user.id)) {
      if (chat.mutedUsers[getIndexMutedUser(chat.mutedUsers, user.id)].timer === 0)
        return undefined;
      const date = new Date();
      if (date.valueOf() - chat.mutedUsers[getIndexMutedUser(chat.mutedUsers, user.id)].dateMute.valueOf() >= chat.mutedUsers[getIndexMutedUser(chat.mutedUsers, user.id)].timer)
        this.automaticUnmuteUserFromChat(user, chat);
      else
        return undefined;
    }
    if (isUserBanned(chat.bannedUsers, user.id))
      return undefined;
    let time = new Date();
    let inputTime = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
    chat.usernames.push(data.username);
    chat.timeMessages.push(inputTime);
    chat.messages.push(data.message);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {}
    return chat;
  }

  async createPrivateMessage(userToInvite: string, idChat: number, idUser: number) {
    let userInit;
    let userInvited;
    let initialChat;

    try {
      initialChat = await this.chatRepository.findOne(idChat);
      userInit = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    if (initialChat === undefined || userInit === undefined)
      return;
    if (userToInvite === userInit.name)
      return ("You can't invite yourself");
    try {
      userInvited = await this.usersService.findOneByName(userToInvite);
    } catch (error) {
      return ("No user named '" + userToInvite + "'");
    }
    if (userInvited === undefined)
      return;
    if (getIndexUser(initialChat.usersInfos, userInvited.id) >= 0
    && initialChat.usersInfos[getIndexUser(initialChat.usersInfos, userInvited.id)].persoMutedUsers.indexOf(userInit.id) >= 0)
      return;
    let firstSocket = initialChat.usersInfos[getIndexUser(initialChat.usersInfos, userInit.id)].socket;
    // If bug check here.
    let newChat = await this.createChat(idUser, firstSocket);
    let ret = await this.inviteUserIntoChat(userToInvite, newChat.id, userInit.id);
    if (ret === undefined || typeof(ret) === "string")
      return (ret);
    newChat = ret.chat;
    let secondSocket = ret.socket;
    return ({
      socketOne: firstSocket,
      socketTwo: secondSocket,
      chat: newChat,
    });
  }

  async commandAddAdmin(idChat: number, idUser: number, usernameToAdd: string) {
    let chat;
    let userInit: User;
    let userToAdd: User;

    try {
      chat = await this.findOne(idChat);
      userInit = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    if (chat.owners[0] !== userInit.id)
      return ("You aren't the owner of this chat");
    try {
      userToAdd = await this.usersService.findOneByName(usernameToAdd);
    } catch (error) {
      return ("No user named " + usernameToAdd + "!");
    }
    if (isUserMuted(chat.mutedUsers, userToAdd.id))
      return (usernameToAdd + " is muted!");
    else if (isUserBanned(chat.bannedUsers, userToAdd.id))
      return (usernameToAdd + " is banned!");
    else if (chat.admins.indexOf(userToAdd.id) >= 0)
      return (usernameToAdd + " is already an admin!");
    chat.admins.push(userToAdd.id);
    chat = await this.addMessageInArray(chat, userInit.name, "Has promoted " + userToAdd.name + " to admin");
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  async commandRemoveAdmin(idChat: number, idUser: number, usernameToAdd: string) {
    let chat;
    let userInit: User;
    let userToRemove: User;

    try {
      chat = await this.findOne(idChat);
      userInit = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    if (chat.owners[0] !== userInit.id)
      return ("You aren't the owner of this chat");
    try {
      userToRemove = await this.usersService.findOneByName(usernameToAdd);
    } catch (error) {
      return ("No user named " + usernameToAdd + "!");
    }
    if (chat.admins.indexOf(userToRemove.id) < 0)
      return (usernameToAdd + " isn't an admin!");
    chat.admins.splice(chat.admins.indexOf(userToRemove.id), 1);
    chat = await this.addMessageInArray(chat, userInit.name, "Has demoted " + userToRemove.name + " to simple user");
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      throw new Error(error);
    }
    return (chat);
  }

  async checkUserNotBlocked(user1: User, user2: User) {
    let existingRelationship = await this.relationshipsService.checkRelationshipExistWithId(user1.id, user2.id);
    if (existingRelationship === undefined)
      return false;
    if (existingRelationship.status === RelationshipStatus.BLOCKED_REQUESTEE
    || existingRelationship.status === RelationshipStatus.BLOCKED_REQUESTER)
      return true;
    return false;
  }

  async commandGameOptions(idChat: number, idUser: number, usernameToInvite: string, redirect: boolean) {
    let chat: Chat | undefined;
    let userInit: User | undefined;
    let userToInvite: User | undefined;
    
    try {
      chat = await this.findOne(idChat);
      userInit = await this.usersService.findOne(idUser);
    } catch (error) {
      throw new Error(error);
    }
    try {
      userToInvite = await this.usersService.findOneByName(usernameToInvite);
    } catch (error) { return "No such user."; }
    if (userToInvite === undefined)
      return "No such user.";
    else if (userInit.name === userToInvite.name)
      return "You can't play against yourself";
    if (!isUserPresent(chat.usersInfos, userToInvite.id))
      return "User not in this chat.";
    else if (chat.usersInfos[getIndexUser(chat.usersInfos, userToInvite.id)].persoMutedUsers.indexOf(userInit.id) >= 0)
      return "You're muted by this user.";
    else if (isUserMuted(chat.mutedUsers, userInit.id))
      return "You're muted by administrator.";
    else if (await this.checkUserNotBlocked(userInit, userToInvite))
      return "You are blocked with this user.";
    else if (redirect) {
      return 0;
    } else {
      let assembledRulesString = "(points:3#power-up:yes#map:original)";
      await this.usersService.addEventToUserAlert(userInit.id, userToInvite.id, userInit.name + " invited you to play a game. " + assembledRulesString, true, "invitationGame");
      return 0;
    }
  }

  async findAll() {
    return this.chatRepository.find({ relations: ["usersInChat"] });
  }

  async findOne(id: number) {
    const chat = await this.chatRepository.findOne(id, { relations: ["usersInChat"]} );
    if (chat)
      return chat;
    throw new HttpException({
      description: "No chat corresponding."
    }, HttpStatus.NOT_FOUND);
  }

  async suscribeToChat(user: User, chat: Chat) {
    let globalChat = await this.chatRepository.findOne(1);
    if (globalChat === undefined)
      return;
    if (!isUserPresent(globalChat.usersInfos, user.id))
      return;
    chat.usersInfos.push({
      userId: user.id,
      hasProvidedPassword: false,
      persoMutedUsers: globalChat.usersInfos[getIndexUser(globalChat.usersInfos, user.id)].persoMutedUsers,
      socket: "",
    });
    chat.usersInChat.push(user);
    chat = await this.addMessageInArray(chat, user.name, JOINED_MESSAGE);
    try {
      await this.chatRepository.save(chat);
    } catch (error) {
      return;
    }
    this.chatGateway.sendToAllSocketsIntoChat(chat);
    // We pull user's socket from global to update his chat.
    let userIdToFind = user.id;
    let socketToEmit = globalChat.usersInfos.find(o => o.userId === userIdToFind);
    if (socketToEmit === undefined)
      return;
    return socketToEmit.socket;
  }
}
