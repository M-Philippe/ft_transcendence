import { Body, Controller, Post, Get, Param, ParseIntPipe, Header, UseGuards, Req } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { CreateChatDto } from "./dto/create-chat";
import { UsersService } from "src/users/users.service";
import { Headers } from '@nestjs/common';
import { ChatGateway } from "./chat.gateway";
import { isUserPresent } from "./utils/chat.usersInfos.utils";
import { JwtGuard } from "src/guards/jwt.guards";
import { JwtAuthService } from "src/auth/jwt/jwt-auth.service";
import { Request } from 'express';

@Controller('chat')
export class ChatController {
  constructor (private readonly chatService: ChatService,
               private readonly usersService: UsersService,
               private readonly chatGateway: ChatGateway,
               private readonly jwtService: JwtAuthService) {}

  @UseGuards(JwtGuard)
  @Get("suscribeChat")
  async suscribeChat(@Headers() header: Record<string, string>, @Req() request: Request) {
    let idUser = this.getIdUserFromCookie(request.cookies.authentication);
    if (header["username"] === undefined || header["idchat"] === undefined)
      return;
    let chat = await this.chatService.findOne(parseInt(header["idchat"]));
    if (chat === undefined || chat.type !== "public")
      return ("Chat not availaible");
    let user = await this.usersService.findOne(idUser);
    if (user === undefined)
      return;
    if (isUserPresent(chat.usersInfos, user.id))
      return ("Chat not availaible");
    let socket = await this.chatService.suscribeToChat(user, chat);
    await this.chatGateway.sendNewChatToSocketFromController({
      socket: socket,
      chatToSend: chat,
    });
  }

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

  @UseGuards(JwtGuard)
  @Get("getListChat")
  async getListChat(@Req() request: Request) {
    let idUser = this.getIdUserFromCookie(request.cookies.authentication);
    return (this.chatService.getListPublicChat(idUser));
  }

  @Get()
  async findAll() {
    return this.chatService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.chatService.findOne(+id);
  }
}
