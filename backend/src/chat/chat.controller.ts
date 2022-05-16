import { Body, Controller, Post, Get, Param, ParseIntPipe, Header } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { CreateChatDto } from "./dto/create-chat";
import { UsersService } from "src/users/users.service";
import { Headers } from '@nestjs/common';
import { ChatGateway } from "./chat.gateway";
import { isUserPresent } from "./utils/chat.usersInfos.utils";

@Controller('chat')
export class ChatController {
  constructor (private readonly chatService: ChatService,
               private readonly usersService: UsersService,
               private readonly chatGateway: ChatGateway) {}

  @Get("suscribeAdminToGlobal")
  async suscribeAdminToGlobal(@Headers() header: Record<string, string>) {
    const id = parseInt(header["userid"]);
    await this.chatService.suscribeAdminToGlobal(id);
  }

  @Get("suscribeChat")
  async suscribeChat(@Headers() header: Record<string, string>) {
    if (header["username"] === undefined || header["idchat"] === undefined)
      return;
    let chat = await this.chatService.findOne(parseInt(header["idchat"]));
    if (chat === undefined || chat.type !== "public")
      return ("Chat not availaible");
    let user = await this.usersService.findOneByName(header["username"]);
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

  @Get("getListChat")
  async getListChat() {
    return (this.chatService.getListPublicChat());
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
