import { HttpCode, HttpException, HttpStatus, Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, Repository } from 'typeorm';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { Relationship, RelationshipStatus } from './entities/relationship.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RelationshipsService {
  constructor(
    @InjectRepository(Relationship)
    private relationshipRepository: Repository<Relationship>,
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
  ) {}

  @HttpCode(201)
  async create(createRelationshipDto: CreateRelationshipDto) {
    // Add protection to check that two similar friendships can't be created.
    //  Simply search a corresponding relationship.
    let checkRelationship = await getConnection()
    .getRepository(Relationship)
    .createQueryBuilder("relationship")
    .innerJoinAndSelect("relationship.requester", "requester")
    .innerJoinAndSelect("relationship.requestee", "requestee")
    .where("requester.id = :requesterId AND requestee.id = :requesteeId",
      {requesteeId: createRelationshipDto.requesteeId, requesterId: createRelationshipDto.requesterId})
    .getOne();
    if (checkRelationship !== undefined)
      return;

    const relationship = this.relationshipRepository.create(createRelationshipDto);
    const users: [User[], number] = await getConnection()
        .getRepository(User)
        .createQueryBuilder('user')
        .where("user.id IN (:...users)", {users: [createRelationshipDto.requesteeId, createRelationshipDto.requesterId]})
        .getManyAndCount();
    if (users[1] !== 2) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid id.",
        description: "Please choose valid user id's."
      }, HttpStatus.NOT_FOUND);
    }
    if (users[0][0].id === +createRelationshipDto.requesteeId) {
      relationship.requestee = users[0][0];
      relationship.requester = users[0][1];
    } else {
      relationship.requestee = users[0][1];
      relationship.requester = users[0][0];
    }
    await this.relationshipRepository.save(relationship);
    //
    console.error("TRYING TO UPDATE AND RETRIEVE");


    return relationship;
  }

  findAll() {
    return this.relationshipRepository.find({ relations: ["requestee", "requester"]});
  }

  async findOne(id: number) {
    const relationship = await this.relationshipRepository.findOne(id, {relations: ["requester", "requestee"]});
    if (relationship) {
      return relationship;
    }
    throw new HttpException({
      code: "e2300",
      type: "Invalid id.",
      description: "Please choose a valid relationship id."
    }, HttpStatus.NOT_FOUND);
  }

  /*async getIdsFromRelationship(relationship: Relationship) {
    let relationshipWithUser = await this.relationshipRepository.findOne(relationship.id, { relations: ["requestee", "requester"]});
    return (relationshipWithUser);
  }*/

  async checkRelationshipExistWithId(requesteeId: number, requesterId: number) {
    let checkRelationship = await getConnection()
      .getRepository(Relationship)
      .createQueryBuilder("relationship")
      .innerJoinAndSelect("relationship.requester", "requester")
      .innerJoinAndSelect("relationship.requestee", "requestee")
      .where(
        "(requester.id = :requesterId AND requestee.id = :requesteeId)\
        OR (requester.id = :requesteeId AND requestee.id = :requesterId)",
        {requesteeId: requesteeId, requesterId: requesterId})
      .getOne();
    return (checkRelationship);
  }

  async update(relationshipToSave: Relationship, updateRelationshipDto: UpdateRelationshipDto) {
    if (relationshipToSave.status !== RelationshipStatus.PENDING && relationshipToSave.status !== RelationshipStatus.REFUSED)
      return (undefined);
    relationshipToSave.status = updateRelationshipDto.status;
    return (await this.relationshipRepository.save(relationshipToSave));
  }

  async updateStatusToUnfriend(relationshipToUpdate: Relationship) {
    if (relationshipToUpdate.status !== RelationshipStatus.ACCEPTED)
      return (undefined);
    relationshipToUpdate.status = RelationshipStatus.REFUSED;
    return (await this.relationshipRepository.save(relationshipToUpdate));
  }

  async updateStatusToBlock(relationshipToSave: Relationship, updateRelationshipDto: UpdateRelationshipDto) {
    relationshipToSave.status = updateRelationshipDto.status;
    return (await this.relationshipRepository.save(relationshipToSave));
  }

  async getAcceptedRelationshipsWithId(idUser: number) {
    /*let ret = await getConnection()
    .getRepository(Relationship)
    .createQueryBuilder("relationship")
    .innerJoinAndSelect("relationship.requester", "requester")
    .innerJoinAndSelect("relationship.requestee", "requestee")
    .where("(requester.id = :requesterId OR requestee.id = :requesteeId) AND relationship.status = :status",
    {requesteeId: idUser, requesterId: idUser, status: RelationshipStatus.ACCEPTED})
    .getMany();*/
    let ret: string[] = [];
    let user;
    try {
      user = await this.usersService.findOne(idUser);
    } catch (error) {
      console.error("ERROR [getAcceptedRelationships]: ", error);
      return ([]);
    }
    for (let i = 0; i < user.requesteeRelationships.length; i++)
      if (user.requesteeRelationships[i].status === RelationshipStatus.ACCEPTED)
        ret.push(await this.getRequesterName(user.requesteeRelationships[i].id));
    for (let i = 0; i < user.requestedRelationships.length; i++)
      if (user.requestedRelationships[i].status === RelationshipStatus.ACCEPTED)
        ret.push(await this.getRequesteeName(user.requestedRelationships[i].id));
    return (ret);
  }

  async getAllFriendships(idUser: number, relationships: {username: string, status: string}[]) {
    let user;
    try {
      user = await this.usersService.findOne(idUser);
    } catch (error) {
      console.error("ERROR [getAllFriendships]: ", error);
      return;
    }
    for (let i = 0; i < user.requesteeRelationships.length; i++) {
      if (user.requesteeRelationships[i].status === RelationshipStatus.BLOCKED_REQUESTEE)
        relationships.push({
          username: await this.getRequesterName(user.requesteeRelationships[i].id),
          status: "blocked"});
      else if (user.requesteeRelationships[i].status !== RelationshipStatus.BLOCKED_REQUESTER)
        relationships.push({
              username: await this.getRequesterName(user.requesteeRelationships[i].id),
              status: user.requesteeRelationships[i].status});
      }
    for (let i = 0; i < user.requestedRelationships.length; i++) {
      if (user.requestedRelationships[i].status === RelationshipStatus.BLOCKED_REQUESTER)
        relationships.push({
          username: await this.getRequesteeName(user.requestedRelationships[i].id),
          status: "blocked"});
      else if (user.requestedRelationships[i].status !== RelationshipStatus.BLOCKED_REQUESTEE)
        relationships.push({
            username: await this.getRequesteeName(user.requestedRelationships[i].id),
            status: user.requestedRelationships[i].status});
      }
  }

  async getRequesteeName(idRelationship: number) {
    let relationship = await this.findOne(idRelationship);
    return (relationship.requestee.name);
  }

  async getRequesterName(idRelationship: number) {
    let relationship = await this.findOne(idRelationship);
    return (relationship.requester.name);
  }

  async getAcceptedRelationshipsWithName(username: string) {
    let ret: string[] = [];
    let user;
    try {
      user = await this.usersService.findOneByName(username);
    } catch (error) {
      console.error("ERROR [getAcceptedRelationships]: ", error);
      return ([]);
    }
    for (let i = 0; i < user.requesteeRelationships.length; i++)
      if (user.requesteeRelationships[i].status === RelationshipStatus.ACCEPTED)
        ret.push(await this.getRequesterName(user.requesteeRelationships[i].id));
    for (let i = 0; i < user.requestedRelationships.length; i++)
      if (user.requestedRelationships[i].status === RelationshipStatus.ACCEPTED)
        ret.push(await this.getRequesteeName(user.requestedRelationships[i].id));
    return (ret);
  }

  async remove(id: number) {
    const deleteResponse = await this.relationshipRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid id.",
        description: "Please choose a valid relationship id."
      }, HttpStatus.NOT_FOUND);
    }
  }
}
