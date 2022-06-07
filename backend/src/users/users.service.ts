import { forwardRef, HttpCode, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from 'src/chat/entities/chat.entity';
import { comparePassword, encryptPasswordToStoreInDb, password } from 'src/passwordEncryption/passwordEncryption';
import { Relationship } from 'src/relationships/entities/relationship.entity';
import { RelationshipsService } from 'src/relationships/relationships.service';
import { MoreThan, Repository } from 'typeorm';
import { CreateUserDto, CreateUSer42Dto, CreateUserLocalDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersGateway } from './users.gateway';
import { MatchesOnGoingGateway } from 'src/matchesOngoing/matchesOnGoing.gateway';
import { RelationshipStatus } from 'src/relationships/entities/relationship.entity';
import { ChangePasswordDto } from './users.types';
import { API_USER_AVATAR, FRONT_GENERIC_AVATAR } from 'src/urlConstString';

const WIN10 = 0;
const WIN100 = 1;
const WINNINGSTREAK3 = 2;
const WINNINGSTREAK10 = 3;
const TOP10 = 4;
const TOP3 = 5;
const TOP1 = 6;
const GAME10 = 7;
const GAME100 = 8;
const GAME1000 = 9;


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => UsersGateway)) private readonly usersGateway: UsersGateway,
    @Inject(forwardRef(() => RelationshipsService)) private readonly relationshipsService: RelationshipsService,
    @Inject(forwardRef(() => MatchesOnGoingGateway)) private readonly matchesOnGoingGateway: MatchesOnGoingGateway) {}

  async onApplicationBootstrap() {
    // We create sudo user [id: 0]
    const checkSudoExist = await this.usersRepository.findOne({where: { id: 1}});
    if (checkSudoExist !== null && checkSudoExist !== undefined)
      return;
    try {
      const sudo = await this.createUserLocal({ name: "Admin", password: "Admin" });
    } catch (error) {}
  }

  @HttpCode(201)
  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    user.online = false;
    user.inGame = false;
    user.listChat = [];
    user.userAlert = {socket: "", alert: []};
    this.createUserAchievements(user);
    try {
      await this.usersRepository.save(user);
    } catch (error) {
        throw new HttpException({
          code: "e2301",
          type: "Invalid user name.",
          description: "Please choose a unique user name."
        }, HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  async is2faEnabled(idUser: number) {
    let user;
    try {
      user = await this.findOne(idUser);
    } catch (error) {
      throw new HttpException({
        type: "No such User."
      }, HttpStatus.NO_CONTENT);
    }
    return({
      is2faEnabled: user.twoFactorIsEnabled
    });
  }

  async createUserLocal(createUserLocalDto: CreateUserLocalDto) {
    let avatar = FRONT_GENERIC_AVATAR;
    const user = this.usersRepository.create({
      name: createUserLocalDto.name,
      avatar: avatar,
      hasAlreadyChanged42Name: false,
      twoFactorIsEnabled: false,
      listChat: [],
      userAlert: {socket: "", alert: []},
      online: false,
      inGame: false,
    });
    this.createUserAchievements(user);
    user.password = await encryptPasswordToStoreInDb(undefined, createUserLocalDto.password);
    try {
      await this.usersRepository.save(user);
    } catch (error) {
      throw new Error(error);
    }
  }

  @HttpCode(200)
  async checkInputCredentials(username: string, password: string) {
    let user: User;
    try {
      user = await this.findOneByName(username);
    } catch (error) {
      throw new Error();
    }
    if (!(await comparePassword(user.password, password)))
      throw new Error();
    return ({
      idUser: user.id,
      username: user.name,
      avatar: user.avatar,
      twoFactorIsEnabled: user.twoFactorIsEnabled,
    });
  }

  @HttpCode(200)
  async disconnectUser(idUser: number) {
    try {
      await this.usersRepository.update({ id: idUser}, { online: false, hasAlreadyChanged42Name: true });
    } catch (error) {
      throw new HttpException({
        type: "No such User."
      }, HttpStatus.NO_CONTENT);
    }
  }

  async updatePassword(idUser: number, changePasswordDto: ChangePasswordDto) {
    let user: User;
    try {
      user = await this.findOne(idUser);
    } catch (error) {
      throw new Error("No such user!");
    }
    if (changePasswordDto.currentPassword === "" || changePasswordDto.newPassword === "" || changePasswordDto.confirmNewPassword === "")
      throw new Error("Password musn't be empty");
    else if (!(await comparePassword(user.password, changePasswordDto.currentPassword)))
      throw new Error("Invalid password");
    else if (changePasswordDto.currentPassword === changePasswordDto.newPassword)
      throw new Error("Your new password must be different");
    else if (changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword)
      throw new Error("New password isn't the same");
    let newPassword = await encryptPasswordToStoreInDb(undefined, changePasswordDto.newPassword);
    try {
      await this.usersRepository.update({id: idUser}, { password: newPassword});
    } catch (error) {
      throw new Error("Internal Server Error, please try later");
    }
  }

  @HttpCode(200)
  async setUserOnline(idUser: number, status: boolean) {
    // must set socket in userAlert to empty string.
    try {
      await this.usersRepository.update({ id: idUser }, { online: status, hasAlreadyChanged42Name: true });
    } catch (error) {}
  }

  async setUserOfflineAndSocketToNull(idUser: number) {
    let user = await this.findOne(idUser);
    //user.userAlert.socket = "";
    user.online = false;
    //await this.usersRepository.save(user);
    await this.usersRepository.update(user.id, { online: false });
  }

  async updateSocketAndGetUserAlert(userId: number, socket: string) {
    let user = await this.usersRepository.findOne({where: {id: userId}});
    if (user === undefined || user === null)
      return undefined;
    user.userAlert.socket = socket;
    await this.usersRepository.update({ id: userId }, { userAlert: user.userAlert });
    return (user.userAlert);
  }

  /*
  **  ALERTS
  */

  async addEventToUserAlert(idUserInitiator: number, idUserToAlert: number , message: string, needResponse: boolean, type: "friendships" | "achievements" | "invitationGame") {
    let user = await this.usersRepository.findOne({where: {id: idUserToAlert}});
    if (user === undefined || user === null)
      return;
    if (user.userAlert.alert === undefined)
      user.userAlert.alert = [];
    user.userAlert.alert.unshift({
      message: message,
      needResponse: needResponse,
      requesterId: idUserInitiator,
      requesteeId: idUserToAlert,
      type: type
    });
    await this.usersRepository.update({id: user.id}, { userAlert: user.userAlert });
    await this.usersGateway.sendUserNewAlert(user.userAlert);
  }

  async removeAlertFromUserAlertAndContactSocket(userId: number, index: number) {
    // Here we must pull a fresh instance of User because relationship isn't up-to-date with previous user instance.
    let user = await this.findOne(userId);
    user.userAlert.alert.splice(index, 1);
    await this.usersRepository.save(user);
    await this.usersGateway.sendUserNewAlert(user.userAlert);
  }

  async handleAlertFriendship(requestee: User, requesteeId: number, requesterId: number, response: string, indexAlert: number) {
    let relationshipToUpdate: Relationship | undefined | null = await this.relationshipsService.checkRelationshipExistWithId(requesteeId, requesterId);
    if (relationshipToUpdate === undefined || relationshipToUpdate === null || (relationshipToUpdate.status !== RelationshipStatus.PENDING && relationshipToUpdate.status !== RelationshipStatus.REFUSED)) {
      await this.removeAlertFromUserAlertAndContactSocket(requestee.id, indexAlert);
      return (undefined);
    }
    if (response === "no") {
      await this.relationshipsService.update(relationshipToUpdate, {status: RelationshipStatus.REFUSED});
      await this.removeAlertFromUserAlertAndContactSocket(requestee.id, indexAlert);
    } else {
      let ret = await this.relationshipsService.update(relationshipToUpdate, {status: RelationshipStatus.ACCEPTED});
      await this.removeAlertFromUserAlertAndContactSocket(requestee.id, indexAlert);
      if (ret !== undefined)
        return (requestee.name + " has accepted your friendship request");
      else
        return (undefined);
    }
    return (undefined);
  }

  async handleAlertClear(requestee: User, idx: number) {
    await this.removeAlertFromUserAlertAndContactSocket(requestee.id, idx);
    return (undefined);
  }

  async handleAlertInvitationGame(requestee: User, requesterId: number, response: string, indexAlert: number) {
    let requester;
    try {
      requester = await this.usersRepository.findOne({where: {id: requesterId}});
    } catch (error) {
      return (undefined);
    }
    console.error("REQUESTER: ", requester?.name, " | online: ", requester?.online, " | inGame: ", requester?.inGame);
    if (requester === undefined || requester === null)
      return (undefined)
    else if (!requester.online || requester.inGame) {
      await this.removeAlertFromUserAlertAndContactSocket(requestee.id, indexAlert);
      return ({
        message: requester.name + requester.inGame ? " is in game/queue." : " isn't connected!"/* (requester) online: " + requester.online + " | ingame: " + requester.inGame*/
      });
    }
    else if (requestee.inGame) {
      return undefined;
    }
    // createMatch with ids and emit to socket to assign new Location.
    if (response === "no") {
      await this.removeAlertFromUserAlertAndContactSocket(requestee.id, indexAlert);
      return (undefined);
    } else if (response === "yes") {
      if (requester.userAlert.socket === "") {
        await this.removeAlertFromUserAlertAndContactSocket(requestee.id, indexAlert);
        return ({ message: "Intern problem, socket"});
      }
      this.matchesOnGoingGateway.createMatchFromInvitation(requester.id, requestee.id, requestee.userAlert.alert[indexAlert].message);
      await this.removeAlertFromUserAlertAndContactSocket(requestee.id, indexAlert);
      return ({redirection: true});
    }
  }

  async findAlertByMessageAndExecute(requesterId: number, requesteeId: number, message: string, response: string) {
    let requestee = await this.usersRepository.findOne({where: {id : requesteeId}});
    if (requestee === undefined || requestee === null || requestee.userAlert.alert === undefined || requestee.userAlert.alert.length === 0)
      return (undefined);
    for (let i = 0; i < requestee.userAlert.alert.length; i++) {
      if (requestee.userAlert.alert[i].message === message) {
        if (requestee.userAlert.alert[i].type === "friendships") {
          return (await this.handleAlertFriendship(requestee, requesteeId, requesterId, response, i));
        } else if (requestee.userAlert.alert[i].type === "invitationGame") {
          return (await this.handleAlertInvitationGame(requestee, requesterId, response, i));
        } else if (requestee.userAlert.alert[i].type === "achievements") {
          return (await this.handleAlertClear(requestee, i));
        }
      }
    }
  }

  async contactSocketUser(idUser: number, message: string) {
    let user = await this.usersRepository.findOne({where: {id: idUser}});
    if (user === undefined || user === null || user.userAlert.socket === "")
      return;
    this.usersGateway.contactUser(user.userAlert.socket, message);
  }

  async sendRedirectionBothSocket(requesterId: number, requesteeId: number) {
    let userOne;
    let userTwo;
    try {
      userOne = await this.usersRepository.findOne({where: {id: requesterId}});
      userTwo = await this.usersRepository.findOne({where: {id: requesteeId}});
    } catch (error) {
      return;
    }
    if ((userOne === null || userTwo === null) || (userOne === undefined || userTwo === undefined))
      return;
    if (userOne.userAlert.socket === "" || userTwo.userAlert.socket === "")
      return;
    console.error("REDIRECTION_TO_BOARD");
    this.usersGateway.contactUsers(userOne.userAlert.socket, userTwo.userAlert.socket, "redirectionToBoard");
  }

  async getGameInfos(idUser: number) {
    let user: User;
    try {
      user = await this.findOne(idUser);
    } catch (error) { console.error("H");return undefined; }
    if (user === undefined)
      return undefined;
    let ret: {
      wonCount: number,
      lostCount: number,
      achievements: String[]
    } = {wonCount: 0, lostCount: 0, achievements: []};
    ret.wonCount = user.wonCount;
    ret.lostCount = user.lostCount;
    ret.achievements = await this.getUserAchievements(idUser);
    return ret;
  }

  /*
  **  ACHIEVEMTS
  */

  replaceAt(index: number, str: String) {
    let ret = str.substring(0, index) + 'o' + str.substring(index + 1);
    return ret;
  }

  createUserAchievements(user: User) {
    user.achievements = "xxxxxxxxxx";
  }

  async checkUserAchievements(username: string) {
    let user;
    try {
      user = await this.usersRepository.findOne({ where: { name: username }});
    } catch (error) { return; }
    if (user === null)
      return;
    if (user.achievements[WIN10] == 'x' && user.wonCount > 9) {
      user.achievements = this.replaceAt(WIN10, user.achievements);
      await this.addEventToUserAlert(-1, user.id, "Felicitation ! This is your tenth victory !", false, "achievements");
    }
    if (user.achievements[WIN100] == 'x' && user.wonCount > 99) {
      user.achievements = this.replaceAt(WIN100, user.achievements);
      await this.addEventToUserAlert(-1, user.id, "Felicitation ! This is your hundredth victory !", false, "achievements");
    }
    if (user.achievements[WINNINGSTREAK3] == 'x' && user.winningStreak > 2) {
      user.achievements = this.replaceAt(WINNINGSTREAK3, user.achievements);
      await this.addEventToUserAlert(-1, user.id, "Congratulations ! You have won three game in a row !", false, "achievements");
    }
    if (user.achievements[WINNINGSTREAK10] == 'x' && user.winningStreak > 9) {
      user.achievements = this.replaceAt(WINNINGSTREAK10, user.achievements);
      await this.addEventToUserAlert(-1, user.id, "Congratulations ! You have won ten game in a row !", false, "achievements");
    }
    if (user.wonCount + user.lostCount > 0 && user.achievements[TOP1] == 'x') {
      let count = await this.usersRepository.count({ where: { wonCount: MoreThan(user.wonCount) }});
      if (user.achievements[TOP10] == 'x' && count < 10) {
        user.achievements = this.replaceAt(TOP10, user.achievements);
        await this.addEventToUserAlert(-1, user.id, "Congratulations ! You are in the ten best players !", false, "achievements");
      }
      if (user.achievements[TOP3] == 'x' && count < 3) {
        user.achievements = this.replaceAt(TOP3, user.achievements);
        await this.addEventToUserAlert(-1, user.id, "Congratulations ! You are in the three best players !", false, "achievements");
      }
      if (user.achievements[TOP1] == 'x' && count == 0) {
        user.achievements = this.replaceAt(TOP1, user.achievements);
        await this.addEventToUserAlert(-1, user.id, "Congratulations ! You are THE best players !", false, "achievements");
      }
    }
    if (user.achievements[GAME10] == 'x' && user.wonCount + user.lostCount > 9) {
      user.achievements = this.replaceAt(GAME10, user.achievements);
      await this.addEventToUserAlert(-1, user.id, "First step: You played ten games.", false, "achievements");
    }
    if (user.achievements[GAME100] == 'x' && user.wonCount + user.lostCount > 99) {
      user.achievements = this.replaceAt(GAME100, user.achievements);
      await this.addEventToUserAlert(-1, user.id, "Road to pro player: You played one hundred games.", false, "achievements");
    }
    if (user.achievements[GAME1000] == 'x' && user.wonCount + user.lostCount > 999) {
      user.achievements = this.replaceAt(GAME1000, user.achievements);
      await this.addEventToUserAlert(-1, user.id, "Nothing but pong: You played one thousand games...", false, "achievements");
    }
    // CHECK THIS UPDATE WITH VROTH-DI
    //await this.usersRepository.save(user);
    await this.usersRepository.update({id: user.id}, { achievements: user.achievements });
  }

  async getUserAchievements(id: number) {
    let userAchievements = (await this.findOne(id)).achievements;
    let achievements: String[] = [];
    if (userAchievements[WIN10] == 'o')
      achievements.push("I can see the pallet - 10 victory");
    if (userAchievements[WIN100] == 'o')
      achievements.push("Master of Pallet - 100 victory");
    if (userAchievements[WINNINGSTREAK3] == 'o')
      achievements.push("On The Road - 3 victory in a row");
    if (userAchievements[WINNINGSTREAK10] == 'o')
      achievements.push("Unstoppable - 10 victory in a row");
    if (userAchievements[TOP10] == 'o')
      achievements.push("Worst Of The Best");
    if (userAchievements[TOP3] == 'o')
      achievements.push("The Podium");
    if (userAchievements[TOP1] == 'o')
      achievements.push("Above The Others");
    if (userAchievements[GAME10] == 'o')
      achievements.push("Begginer Player - 10 games");
    if (userAchievements[GAME100] == 'o')
      achievements.push("Semi Pro Player - 100 games");
    if (userAchievements[GAME1000] == 'o')
      achievements.push("Pro Player - 1000 games");
    return (achievements);
  }

  /*
  **  LOGIN_42
  */

  async checkUsernameExist(usernameToFind: string) {
    //const user = await this.usersRepository.findOne(usernameToFind);
    let user = await this.usersRepository.count({ where: { name: usernameToFind }});
    if (user != 0)
      return false;
    return true;
  }

  async createUser42(userToCreate: CreateUSer42Dto) {
    // TODO: add verif that no identical name exists. If so, add random number to origin-name.
    let user = await this.usersRepository.findOne({ where: { id42: userToCreate.id42 }});
    if (user !== null && user !== undefined) {
      user.online = true;
      user.inGame = false;
      user.userAlert = {socket: "", alert: []};
      try {
        user = await this.usersRepository.save(user);
      } catch (error) {
        return (undefined);
      }
      return ({ state: "exist", user: user });
    }
    // generate name to prevent same user.
    let count = 0;
    while (await this.checkUsernameExist(userToCreate.name) == false) {
      userToCreate.name = userToCreate.name + count.toString();
      count++;
    }
    try {
      user = this.usersRepository.create(userToCreate);
      user.online = true;
      user.inGame = false;
      this.createUserAchievements(user);
      user = await this.usersRepository.save(user);
    } catch (error) {
      return (undefined);
    }
    return ({ state: "created", user: user });
  }

  async changeUsername42(idUser: number, newName: string) {
    let user = await this.usersRepository.findOne({where: {id: idUser}});
    if (user === null || user === undefined)
      return ({ message: "Error intern." });
    if (user.hasAlreadyChanged42Name) {
      return ({ message: "You already have changed your username" });
    } else if (user.id42 === -1)
      return ("You can't change your username");
    else {
      user.hasAlreadyChanged42Name = true;
      user.name = newName;
      try {
        user = await this.usersRepository.save(user);
      } catch (error) {
        return ({ message: "Error intern." });
      }
      return ({
        message: "Ok",
        username: user.name,
        avatar: user.avatar,
        idUser: user.id,
      });
    }
  }

  async setHasChangedName42ToTrue(idUser: number) {
    let user;
    try {
      await this.usersRepository.update({id: idUser}, { hasAlreadyChanged42Name: true });
      user = await this.usersRepository.findOne({ where: { id: idUser }});
    } catch (error) { return; }
    if (user === null)
      return;
    return ({name: user.name, avatar: user.avatar, idUser: user.id});
  }

  async updateAvatar(idUser: number, avatar: string) {
    let user = await this.usersRepository.findOne({ where: {id: idUser}});
    if (user === null || user === undefined)
      return (undefined);
    try {
      await this.usersRepository.update({ id: idUser }, { avatar: API_USER_AVATAR + avatar });
    } catch (error) {
      return undefined;
    }
    if (user.avatar === FRONT_GENERIC_AVATAR)
      return (undefined);
    else
      return (user.avatar);
  }

  /*
  **  AUTH
  */
  async updateTwoFactorSecret(id: number, secret: string) {
    await this.usersRepository.update(id, { twoFactorSecret: secret });
    return this.findOne(id);
  }

  async updateTwoFactorEnabled(id: number, twoFactorEnable: boolean) {
    await this.usersRepository.update(id, { twoFactorIsEnabled: twoFactorEnable });
    return this.findOne(id);
  }

  findAll() {
    return this.usersRepository.find({ relations: ["matches", "listChat", "requestedRelationships", "requesteeRelationships"] });
  }

  async findAllForRanking() {
    let ret = await this.usersRepository.findAndCount({select: ["name", "avatar", "wonCount", "lostCount"]});
    let returnedUsers = ret[0];
    for (let i = 0; i < returnedUsers.length; i++) {
      if (returnedUsers[i].name === "Admin")
        returnedUsers.splice(i, 1);
    }
    return returnedUsers;
  }

  async findOne(id: number) {
    //const user = await this.usersRepository.findOne(id, { relations: ["matches", "listChat"] });
    const user = await this.usersRepository.findOne({ where: {id: id}, relations: ["matches", "listChat"]});//id, { relations: ["matches", "listChat"] });
    if (user) {
      return user;
    }
    throw new HttpException({
      code: "e2300",
      type: "Invalid id.",
      description: "Please choose a valid user id."
    }, HttpStatus.NOT_FOUND);
  }

  async findOneByName(name: string) {
    //const user = await this.usersRepository.findOne({name}, { relations: ["matches", "listChat", "requestedRelationships", "requesteeRelationships"] });
    const user = await this.usersRepository.findOne({ where: {name: name}, relations: ["matches", "listChat", "requestedRelationships", "requesteeRelationships"] });
    if (user) {
      return user;
    }
    throw new HttpException({
      code: "e2300",
      type: "Invalid name.",
      description: "Please choose a valid user name."
    }, HttpStatus.NOT_FOUND);
  }

  async getListChatUser(name: string) {
    //const user = await this.usersRepository.findOne({name}, { relations: ["matches", "listChat"]});
    const user = await this.usersRepository.findOne({ where: {name: name}, relations: ["matches", "listChat"]});
    if (user) {
      return JSON.stringify(user.listChat);
    }
    throw new HttpException({
      code: "e2300",
      type: "Invalid name.",
      description: "Please choose a valid user name."
    }, HttpStatus.NOT_FOUND);
  }

  async removeChat(idChat: number, user: User) {
    let i = 0;
    while (i < user.listChat.length) {
      if (user.listChat[i].id === idChat) {
        user.listChat.splice(i, 1);
        break;
      }
      i++;
    }
    try {
      await this.usersRepository.save(user);
    } catch (error) {
      throw new Error(error);
    }
  }

  async addChat(chat: Chat, user: User) {
    user.listChat.push(chat);
    try {
      await this.usersRepository.save(user);
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAllRelationships(id: number) {
    let user = await this.findOne(id);
    return { 'requested': user.requestedRelationships, 'requestee': user.requesteeRelationships };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async setInGame(username: string, value: boolean) {
    try {
      await this.usersRepository.update({ name: username }, { inGame: true });
    } catch(error) {}
  }

  async setNotInGame(username: string) {
    await this.usersRepository.update({name: username}, {inGame: false});
  }

  async remove(id: number) {
    const deleteResponse = await this.usersRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid id.",
        description: "Please choose a valid user id."
      }, HttpStatus.NOT_FOUND);
    }
  }
}
