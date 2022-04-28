import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MatchesOnGoingService } from './matchesOnGoing.service';
import { CreateMatchOngoingDto  } from './dto/create-matchesOngoing';

class PlayerLeavingDto {
  username: string;
  idGame: number;
}

@Controller('matchesOnGoing')
export class MatchesOnGoingController {
  constructor(private readonly matchesOnGoingService: MatchesOnGoingService) {}

  @Post()
  async create(@Body() createMatchOnGoingDto: CreateMatchOngoingDto) {
    //return this.matchesOnGoingService.create(createMatchOnGoingDto);
  }

  @Post("/delete")
  async deleteMatches(@Body() body: { id: number}) {
    console.error("\nID_RECEIVED: ", body.id);
    await this.matchesOnGoingService.deleteGame(body.id);
  }

  @Get()
  async findAll() {
    return this.matchesOnGoingService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.matchesOnGoingService.findOne(+id);
  }

  @Post("/playerLeaving")
  async playerLeaving(@Body() playerLeavingDto: PlayerLeavingDto) {
    // Check validity user.
    if (playerLeavingDto.username === undefined || playerLeavingDto.idGame === undefined)
      return;
    await this.matchesOnGoingService.playerDisconnected(playerLeavingDto.idGame, playerLeavingDto.username);
  }
}
