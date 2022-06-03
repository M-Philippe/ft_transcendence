import { forwardRef, HttpCode, HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { CreateMatchDto } from './dto/create-match.dto';
import { Match } from './entities/match.entity';

@Injectable()
export class MatchesService {
  constructor (
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService
  ) {}

  @HttpCode(201)
  async create(createMatchDto: CreateMatchDto) {
    const match = this.matchesRepository.create(createMatchDto);
    let player1, player2;
    try {
      player1 = await this.usersService.findOneByName(createMatchDto.player1);
      player2 = await this.usersService.findOneByName(createMatchDto.player2);
    } catch (error) { return; }
    if (match.winner === player1.name) {
      ++player1.wonCount;
      ++player1.winningStreak;
      ++player2.lostCount;
      player2.winningStreak = 0;
    } else {
      ++player1.lostCount;
      player1.winningStreak = 0;
      ++player2.wonCount;
      ++player2.winningStreak;
    }
    match.users = [player1, player2];
    await this.matchesRepository.save(match);
    return match;
  }

  findAll() {
    return this.matchesRepository.find();
  }

  async findOne(id: number) {
    const match = await this.matchesRepository.findOne({where: {id: id}});
    if (match) {
      return match;
    }
    throw new HttpException({
      description: "Please provide a valid match id."
    }, HttpStatus.NOT_FOUND);
  }

  async getMatchHistory(usernameToFetch: string) {
    let user = await this.usersService.findOneByName(usernameToFetch);
    if (user === undefined)
      return "No such user.";
    let ret: Array<{opponent: string, winner: string, date: Date}> = [];
    for (let i = 0; i < user.matches.length; i++) {
      ret.push({
        opponent: user.matches[i].player1 === usernameToFetch ? user.matches[i].player2 : user.matches[i].player1,
        winner: user.matches[i].winner,
        date: user.matches[i].date,
      });
    }
    return ret;
  }
}
