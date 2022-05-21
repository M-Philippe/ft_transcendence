import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { Chat } from "./entities/chat.entity";
import { ChatGateway } from "./chat.gateway";
import { UsersModule } from "src/users/users.module";
import { JwtAuthModule } from "src/auth/jwt/jwt-auth.module";
import { RelationshipsModule } from "src/relationships/relationships.module";

@Module({
  imports: [TypeOrmModule.forFeature([Chat]), UsersModule, JwtAuthModule, forwardRef(() => RelationshipsModule)],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
