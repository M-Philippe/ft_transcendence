import { HttpCode, HttpException, HttpStatus, Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { Relationship, RelationshipStatus } from './entities/relationship.entity';
import { UsersService } from 'src/users/users.service';
import { PostgresDataSource } from 'src/dataSource';

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
    // Check here if bug.
    let checkRelationship = await this.checkRelationshipExistWithId(parseInt(createRelationshipDto.requesteeId), parseInt(createRelationshipDto.requesterId));
    if (checkRelationship !== null)
      return;

    const relationship = this.relationshipRepository.create(createRelationshipDto);
    let requestee;
    let requester;
    try {
      requestee = await this.usersService.findOne(parseInt(createRelationshipDto.requesteeId));
      requester = await this.usersService.findOne(parseInt(createRelationshipDto.requesterId));
    } catch (error) {
      throw new HttpException({
        code: "e2300",
        type: "Invalid id.",
        description: "Please choose valid user id's."
        }, HttpStatus.NOT_FOUND);
    }
    relationship.requestee = requestee;
    relationship.requester = requester;
    await this.relationshipRepository.save(relationship);
    return relationship;
  }

  findAll() {
    return this.relationshipRepository.find({ relations: ["requestee", "requester"]});
  }

  async findOne(id: number) {
    const relationship = await this.relationshipRepository.findOne({where: {id: id}, relations: ["requester", "requestee"]});
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
    const relationship = await PostgresDataSource
    .createQueryBuilder(Relationship, "relationship")
    .innerJoinAndSelect("relationship.requester", "requester")
    .innerJoinAndSelect("relationship.requestee", "requestee")
    .where(
      "(requester.id = :requesterId AND requestee.id = :requesteeId)\
      OR (requester.id = :requesteeId AND requestee.id = :requesterId)",
      {requesteeId: requesteeId, requesterId: requesterId})
    .getOne();
    // let checkRelationship = await this.findAll();
    // for (let i = 0; i < checkRelationship.length; i++) {
    //   if (
    //     (checkRelationship[i].requester.id === requesterId && checkRelationship[i].requestee.id === requesteeId) ||
    //     (checkRelationship[i].requester.id === requesteeId && checkRelationship[i].requestee.id === requesterId)
    //     )
    //     return checkRelationship[i];
    // }
    return (relationship);
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
    let ret: string[] = [];
    let user;
    try {
      user = await this.usersService.findOneWithRelations(idUser);
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
      user = await this.usersService.findOneWithRelations(idUser);
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
      user = await this.usersService.findOneByNameWithRelations(username);
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
