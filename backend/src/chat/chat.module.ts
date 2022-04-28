import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { Chat } from "./entities/chat.entity";
import { ChatGateway } from "./chat.gateway";
import { UsersModule } from "src/users/users.module";
import { JwtAuthModule } from "src/auth/jwt/jwt-auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Chat]), UsersModule, JwtAuthModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
