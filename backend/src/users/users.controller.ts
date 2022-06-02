import { HttpException, HttpStatus, Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Put, Req, Res, UseGuards, UseInterceptors, UploadedFile, StreamableFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request, Response } from 'express';
import { JwtGuard } from 'src/guards/jwt.guards';
import { JwtAuthService } from 'src/auth/jwt/jwt-auth.service';
import { getConnection } from 'typeorm';
import { User } from './entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from "multer";
import { createReadStream, fstat, ReadStream } from 'fs';
import * as fs from "fs";
import { join } from 'path';
import { RelationshipsService } from 'src/relationships/relationships.service';
import { Relationship, RelationshipStatus } from 'src/relationships/entities/relationship.entity';
import { ChangePasswordDto } from './users.types';
import { API_USER_AVATAR } from 'src/urlConstString';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtAuthService,
    private readonly relationshipsService: RelationshipsService
  ) {}

  @UseGuards(JwtGuard)
  @Get("/is2faEnabled")
  async is2faEnabled(@Req() request: Request) {
    let idUser = this.getIdUserFromCookie(request.cookies.authentication);
    return (await this.usersService.is2faEnabled(idUser));
  }

  @UseGuards(JwtGuard)
  @Post("/responseAlert")
  async responseAlert(@Body() body: {message: string, requesterId: number, requesteeId: number, response: string}) {
    let response = await this.usersService.findAlertByMessageAndExecute(body.requesterId, body.requesteeId, body.message, body.response);
    if (response === undefined) {
      return;
    }
    else if (typeof(response) === "object") {
      // If type(object) we check that no error is provided, and then contact two socket to start game. (socket will check availability)
      // if !online || inGame error, contact socket and remove.
      if (response.message)
        this.usersService.contactSocketUser(body.requesteeId, response.message);
      else if (response.redirection) {
        // send redirection to two socket, if any error throw we delete created match.
        await this.usersService.sendRedirectionBothSocket(body.requesterId, body.requesteeId);
      }
    }
    else
      this.usersService.contactSocketUser(body.requesterId, response);
  }

  @UseGuards(JwtGuard)
  @Post("/avatarUpload")
  @UseInterceptors(FileInterceptor("avatar", {storage: diskStorage({destination: "./uploads/"})}))
  async avatarUpload(@Req() request: Request , @UploadedFile() file: Express.Multer.File) {
    let idUser = this.getIdUserFromCookie(request.cookies.authentication);
    let fileToDelete = await this.usersService.updateAvatar(idUser, file.filename);
    // delete old avatar in filename.
    if (fileToDelete !== undefined) {
      let domain = API_USER_AVATAR;
      let fileNameToDelete = fileToDelete.slice(domain.length);
      fs.unlink("./uploads/" + fileNameToDelete, (error) => {
      });
    }
    return (JSON.stringify(API_USER_AVATAR + file.filename));
  }

  @UseGuards(JwtGuard)
  @Post("/inviteMatch")
  async inviteMatch(
    @Req() request: Request,
    @Body() body: { usernameToInvite: string, rules: {scoreMax: number, powerUp: boolean, map: string}}) {
    if (body.rules.map !== "original" && body.rules.map !== "desert" && body.rules.map !== "jungle")
      body.rules.map = "original";
    if (body.rules.scoreMax != 3 && body.rules.scoreMax != 5 && body.rules.scoreMax != 7)
      body.rules.scoreMax = 3;
    const idUser = this.getIdUserFromCookie(request.cookies.authentication);
    let userWhoInvite;
    let userToInvite;
    try {
      userWhoInvite = await this.usersService.findOne(idUser);
      userToInvite = await this.usersService.findOneByName(body.usernameToInvite);
    } catch (error) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid name.",
        description: "Please choose a valid user name."
      }, HttpStatus.NOT_FOUND);
    }
    // check that user isn't blocked
    let existingRelationship = await this.relationshipsService.checkRelationshipExistWithId(userWhoInvite.id, userToInvite.id);
    if (existingRelationship !== undefined &&
      (existingRelationship.status === RelationshipStatus.BLOCKED_REQUESTEE ||
        existingRelationship.status === RelationshipStatus.BLOCKED_REQUESTER))
      return;
    let assembledRulesString =
      "(points: " + body.rules.scoreMax
      + " | power-up: " + (body.rules.powerUp ? "yes" : "no")
      + " | map: " + body.rules.map + ")";
    // Check that user idUser isn't blocked by userToInvite (&& online && !inGame)
    await this.usersService.addEventToUserAlert(idUser, userToInvite.id, userWhoInvite.name + " invited you to play a game. " + assembledRulesString, true, "invitationGame");
  }

  @Get("avatar/:avatarName")
  async getAvatar(@Param('avatarName') filename: string) {
    //console.log("\nREQUEST FILENAME: ", filename, "\n");
    let file: ReadStream;
    try {
    file = createReadStream(join(process.cwd(), "./uploads/" + filename));
    } catch (error) {
      return;
    }
    file.on("error", () => {
      return;
    });
    return (new StreamableFile(file));
  }

  @Get()
  findAll() {
    return this.usersService.findAllForRanking();
  }

  @UseGuards(JwtGuard)
  @Put("/disconnectUser")
  async disconnectUser(
    @Req() request: Request,
    @Res() response: Response) {
      let jwtDecrypt = this.jwtService.verify(request.cookies.authentication);
      response.cookie("authentication", "", { httpOnly: true, sameSite: "strict"});
      await this.usersService.disconnectUser(jwtDecrypt.idUser);
      response.send();
      return (response);
  }

  /*
  **  LOGIN_42
  */
  getIdUserFromCookie(jwt: string) {
    if (jwt === undefined)
      return undefined;
    let jwtDecrypted;
    try {
      jwtDecrypted = this.jwtService.verify(jwt);
    } catch (error) {
      return (undefined);
    }
    if (jwtDecrypted === null)
      return (undefined);
    return (jwtDecrypted.idUser);
  }

  @UseGuards(JwtGuard)
  @Post("/setUsernameFirstConnection42")
  async setUsernameFirstConnection42(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    let idUser = this.getIdUserFromCookie(request.cookies.authentication);
    if (idUser === undefined) {
      response.status(403);
      response.send();
      return;
    }
    response.status(200);
    let verifUserWithName = await getConnection()
          .createQueryBuilder()
          .select("user")
          .from(User, "user")
          .where("user.name = :id", { id: JSON.stringify(request.body.newName) })
          .getOne();
    if (verifUserWithName !== undefined) {
      response.send(JSON.stringify({
        message: verifUserWithName.name + " is already taken.",
      }));
    } else {
      let payloadToReturn = await this.usersService.changeUsername42(idUser, request.body.newName);
      response.send(JSON.stringify(payloadToReturn));
    }
  }

  @UseGuards(JwtGuard)
  @Post("/usernameFirstConnection42NoChange")
  async usernameFirstConnection42NoChange(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    let idUser = this.getIdUserFromCookie(request.cookies.authentication);
    if (idUser === undefined) {
      response.status(403);
      response.send();
      return;
    }
    response.status(200);
    let user = await this.usersService.setHasChangedName42ToTrue(idUser);
    response.send(JSON.stringify({
      username: user[0].name,
      avatar: user[0].avatar,
      idUser: user[0].id
    }));
  }

  @UseGuards(JwtGuard)
  @Get("/gameInfos")
  async getGameInfos(@Req() request: Request) {
    let idUser = this.getIdUserFromCookie(request.cookies.authentication);
    return await this.usersService.getGameInfos(idUser);
  }

  @UseGuards(JwtGuard)
  @Get('/name/:input')
  async findOneByName(@Param('input') input: string, @Req() request: Request) {
    let userToFetch: User;
    try {
      userToFetch = await this.usersService.findOneByName(input);
    } catch (error) {
      throw new HttpException({
        type: "No such User."
      }, HttpStatus.NO_CONTENT);
    }
    let idUserInit: number = this.getIdUserFromCookie(request.cookies.authentication);
    let userInit: User;
    try {
      userInit = await this.usersService.findOne(idUserInit);
    } catch (error) {
      throw new HttpException({
        type: "No such User."
      }, HttpStatus.NO_CONTENT);
    }
    let relationshipStatus: string = "none";
    let relationship: Relationship | undefined;
    if ((relationship = await this.relationshipsService.checkRelationshipExistWithId(userInit.id, userToFetch.id))
        !== undefined) {
      if (relationship.status === RelationshipStatus.BLOCKED_REQUESTER && relationship.requester.id === userInit.id)
          relationshipStatus = "blocker";
      else if (relationship.status === RelationshipStatus.BLOCKED_REQUESTEE && relationship.requestee.id === userInit.id)
          relationshipStatus = "blocker";
      else
        relationshipStatus = relationship.status;
    }
    let achievements = await this.usersService.getUserAchievements(userToFetch.id);
    return ({
      name: userToFetch.name,
      avatar: userToFetch.avatar,
      lostCount: userToFetch.lostCount,
      wonCount: userToFetch.wonCount,
      online: userToFetch.online,
      relationshipStatus: relationshipStatus,
      achievements: achievements
    });
  }

  @UseGuards(JwtGuard)
  @Post("/changePassword")
  async changePassword(@Req() request: Request, @Body() changePasswordDto: ChangePasswordDto) {
    let idUser: number = this.getIdUserFromCookie(request.cookies.authentication);
    try {
      await this.usersService.updatePassword(idUser, changePasswordDto);
    } catch (error) {
      throw new HttpException({
        type: "Invalid password's",
        description: error.message,
      }, HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(JwtGuard)
  @Get('/listChat/:input')
  getListChatUser(@Param('input') input: string) {
    return this.usersService.getListChatUser(input);
  }

  // FRIENDSHIPS
  @Get(':id/relationships')
  findAllRelationships(@Param('id', ParseIntPipe) id: string) {
    return this.usersService.findAllRelationships(+id);
  }

  // ACHIEVEMENTS
  @Get(':id/achievements')
  getAchivements(@Param('id') id: string) {
    return this.usersService.getUserAchievements(+id);
  }
}
