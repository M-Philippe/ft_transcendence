import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MatchesOnGoingGateway } from "./matchesOnGoing.gateway";
import { MatchesOnGoing } from "./entities/matchesOngoing.entity";
import { MatchesOnGoingController } from "./matchesOnGoing.controller";
import { MatchesOnGoingService } from "./matchesOnGoing.service";
import { MatchesModule } from "src/matches/matches.module";
import { JwtGuardsModule } from "src/guards/guards.module";
import { JwtAuthModule } from "src/auth/jwt/jwt-auth.module";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([MatchesOnGoing]),
    forwardRef(() => MatchesModule),
    forwardRef(() => JwtGuardsModule),
    forwardRef(() => JwtAuthModule),
    forwardRef(() => UsersModule)],
  controllers: [MatchesOnGoingController],
  providers: [MatchesOnGoingGateway, MatchesOnGoingService],
  exports: [MatchesOnGoingService]
})
export class MatchesOnGoingModule {}
