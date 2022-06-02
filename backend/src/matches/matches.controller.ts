import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { JwtGuard } from 'src/guards/jwt.guards';
import { JwtAuthService } from 'src/auth/jwt/jwt-auth.service';

@Controller('matches')
export class MatchesController {
    constructor(
      private readonly matchesService: MatchesService,
      private readonly jwtService: JwtAuthService  
    ) {}
  @UseGuards(JwtGuard)
  @Get('/getMatchHistory/:usernameToFetch')
  async getMatchHistory(@Param("usernameToFetch") usernameToFetch: string) {
    let ret = await this.matchesService.getMatchHistory(usernameToFetch);
    if (typeof(ret) === "string") {
      throw new HttpException({
        errorMessage: ret
      }, HttpStatus.NOT_FOUND);
    }
    return JSON.stringify(ret);
  }
}
