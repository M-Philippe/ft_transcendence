export class CreateChatDto {
  public id: number;
  public roomName: string;
  public usernames: string[];
  public timeMessages: string[];
  public messages: string[];
  public admins: number[];
  public users: number[];
  public banned: number[];
}