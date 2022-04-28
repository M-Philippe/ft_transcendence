import { HttpCode, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { getConnection, Repository } from 'typeorm';
import { CreateMatchDto } from './dto/create-match.dto';
import { Match } from './entities/match.entity';

@Injectable()
export class MatchesService {
  constructor (
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
  ) {}

  @HttpCode(201)
  async create(createMatchDto: CreateMatchDto) {
    const match = this.matchesRepository.create(createMatchDto);
    const players = await getConnection()
      .getRepository(User)
      .createQueryBuilder("user")
      .where('user.name IN (:...users)', {users: [createMatchDto.player1, createMatchDto.player2]})
      .getManyAndCount()
    if (players[1] !== 2) {
      throw new HttpException({
        description: "Please choose valid user id's."
      }, HttpStatus.NOT_FOUND);
    }
    if (match.winner === players[0][0].name) {
      ++players[0][0].wonCount;
      ++players[0][0].winningStreak;
      ++players[0][1].lostCount;
      players[0][1].winningStreak = 0;
    } else {
      ++players[0][0].lostCount;
      players[0][0].winningStreak = 0;
      ++players[0][1].wonCount;
      ++players[0][1].winningStreak;
    }
    match.users = [players[0][0], players[0][1]];
    await this.matchesRepository.save(match);
    return match;
  }

  findAll() {
    return this.matchesRepository.find();
  }

  async findOne(id: number) {
    const match = await this.matchesRepository.findOne(id);
    if (match) {
      return match;
    }
    throw new HttpException({
      description: "Please provide a valid match id."
    }, HttpStatus.NOT_FOUND);
  }
}
