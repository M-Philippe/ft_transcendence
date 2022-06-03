import { HttpException, HttpStatus, Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req, Inject, forwardRef } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { JwtGuard } from 'src/guards/jwt.guards';
import { UsersService } from 'src/users/users.service';
import { RelationshipStatus } from './entities/relationship.entity';
import { JwtAuthService } from 'src/auth/jwt/jwt-auth.service';
import { Request } from 'express';

@Controller('relationships')
export class RelationshipsController {
  constructor(
    private readonly relationshipsService: RelationshipsService,
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
    private readonly jwtService: JwtAuthService) {}

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

  @Post()
  @UseGuards(JwtGuard)
  async create(@Req() request: Request, @Body() createRelationshipDto: {usernameToAdd: string}) {
    // getId from requestee.
    let idRequester = this.getIdUserFromCookie(request.cookies.authentication);
    let requestee;
    try {
      requestee = await this.usersService.findOneByName(createRelationshipDto.usernameToAdd);
    } catch (error) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid name.",
        description: "Please choose a valid user name."
      }, HttpStatus.NOT_FOUND);
    }
    let existingRelationship = await this.relationshipsService.checkRelationshipExistWithId(idRequester, requestee.id);
    let relationshipCreated;
    if (existingRelationship !== null && existingRelationship.status === RelationshipStatus.REFUSED) {
      relationshipCreated = existingRelationship;
      await this.relationshipsService.update(relationshipCreated, {status: RelationshipStatus.PENDING});
    } else if (existingRelationship === null) {
      relationshipCreated = await this.relationshipsService.create({
        requesteeId: requestee.id.toString(),
        requesterId: idRequester,
        status: RelationshipStatus.PENDING,
      });
    } else
      throw new HttpException({
        description: "no-op",
      }, HttpStatus.BAD_REQUEST);
    if (relationshipCreated === undefined)
      throw new HttpException("Internal Error", 500);
    let message = (idRequester === relationshipCreated.requester.id ? relationshipCreated.requester.name : relationshipCreated.requestee.name) + " wants to be your friend.";
    await this.usersService.addEventToUserAlert(idRequester, requestee.id , message, true, "friendships");
  }

  @Post("unfriendUser")
  @UseGuards(JwtGuard)
  async unfriendUser(@Req() request: Request, @Body() unfriendDto: {nameToUnfriend: string}) {
    let idUser = this.getIdUserFromCookie(request.cookies.authentication);
    let existingRelationship;
    let userToUnfriend;
    try {
      userToUnfriend = await this.usersService.findOneByName(unfriendDto.nameToUnfriend);
    } catch (error) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid name.",
        description: "Please choose a valid user name."
      }, HttpStatus.NOT_FOUND);
    }
    existingRelationship = await this.relationshipsService.checkRelationshipExistWithId(idUser, userToUnfriend.id);
    if (existingRelationship === undefined || existingRelationship === null) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid name.",
        description: "No such Relationship."
      }, HttpStatus.NOT_FOUND);
    }
    if (existingRelationship.status === RelationshipStatus.ACCEPTED) {
      await this.relationshipsService.updateStatusToUnfriend(existingRelationship);
    }
  }

  @Post("/blockUser")
  @UseGuards(JwtGuard)
  async blockUser(@Req() request: Request, @Body() body: {usernameToBlock: string}) {
    let idRequester = this.getIdUserFromCookie(request.cookies.authentication);
    let requestee;
    try {
      requestee = await this.usersService.findOneByName(body.usernameToBlock);
    } catch (error) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid search.",
        description: "No such user and/or relationship."
      }, HttpStatus.NOT_FOUND);
    }
    let existingRelationship = await this.relationshipsService.checkRelationshipExistWithId(requestee.id, idRequester);
    if (existingRelationship !== null) { // update Relationship
      if (existingRelationship.requester.id === idRequester)
        existingRelationship = await this.relationshipsService.updateStatusToBlock(existingRelationship, { status: RelationshipStatus.BLOCKED_REQUESTER});
      else
        existingRelationship = await this.relationshipsService.updateStatusToBlock(existingRelationship, { status: RelationshipStatus.BLOCKED_REQUESTEE });
      if (existingRelationship === undefined) {
        throw new HttpException("Internal Error", 500);
      }
    } else { // create Relationship with Blocked status.
      let relationshipCreated = await this.relationshipsService.create({
        requesteeId: requestee.id.toString(),
        requesterId: idRequester,
        status: RelationshipStatus.BLOCKED_REQUESTER,
      });
      if (relationshipCreated === undefined)
        throw new HttpException("Internal Error", 500);
    }
  }

  @Post("/unblockUser")
  @UseGuards(JwtGuard)
  async unblockUser(@Req() request: Request, @Body() body: {usernameToUnblock: string}) {
    let idRequester = this.getIdUserFromCookie(request.cookies.authentication);
    let requestee;
    let existingRelationship;
    try {
      requestee = await this.usersService.findOneByName(body.usernameToUnblock);
      existingRelationship = await this.relationshipsService.checkRelationshipExistWithId(requestee.id, idRequester);
    } catch (error) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid search.",
        description: "No such user and/or relationship."
      }, HttpStatus.NOT_FOUND);
    }
    if (existingRelationship === undefined || existingRelationship === null)
      throw new HttpException({
        code: "e2300",
        type: "Invalid search.",
        description: "No such user and/or relationship."
      }, HttpStatus.NOT_FOUND);
    if (existingRelationship.status !== RelationshipStatus.BLOCKED_REQUESTER && existingRelationship.status !== RelationshipStatus.BLOCKED_REQUESTEE)
      throw new HttpException({
        type: "no-op",
        description: "Relationships isn't set on blocked",
      }, HttpStatus.BAD_REQUEST);
    if (existingRelationship.requester.id === idRequester && existingRelationship.status === RelationshipStatus.BLOCKED_REQUESTER)
      existingRelationship = await this.relationshipsService.updateStatusToBlock(existingRelationship, { status: RelationshipStatus.REFUSED});
    else if (existingRelationship.requestee.id === idRequester && existingRelationship.status === RelationshipStatus.BLOCKED_REQUESTEE)
      existingRelationship = await this.relationshipsService.updateStatusToBlock(existingRelationship, { status: RelationshipStatus.REFUSED});
  }

  @Post("/getFriends")
  @UseGuards(JwtGuard)
  async getFriends(@Req() request: Request, @Body() body: { nameToFetch: string }) {
    let ret = await this.relationshipsService.getAcceptedRelationshipsWithName(body.nameToFetch);
    return (JSON.stringify({friends: ret}));
  }

  @UseGuards(JwtGuard)
  @Get("/getAllRelationships")
  async getAllFriendships(@Req() request: Request) {
    let idUser = this.getIdUserFromCookie(request.cookies.authentication);
    let relationshipsToReturn: {username: string, status: string}[] = [];
    await this.relationshipsService.getAllFriendships(idUser, relationshipsToReturn);
    return (relationshipsToReturn);
  }
}
