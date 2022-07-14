import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Muted, Banned, Users } from "../chat.interface";
import { password } from "src/passwordEncryption/passwordEncryption";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column()
  type: string;

  @Column({
    type: "jsonb",
    default: () => "'{}'",
    nullable: true,
  })
  password: password | undefined;

  @Column()
  roomName: string;

  @Column("text", { array: true, default: "{}" })
  usernames: string[];

  @Column("text", { array: true, default: "{}" })
  timeMessages: string[];

  @Column("text", { array: true , default: "{}"})
  messages: string[];

  @Column("int", { array: true })
  owners: number[];

  @Column("int", { array: true})
  admins: number[];

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  usersInfos: Array<Users>;

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  bannedUsers: Array<Banned>;

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  mutedUsers: Array<Muted>;

  @ManyToMany(() => User, user => user.listChat, {
    //cascade: true,
    nullable: true,
  })
  @JoinTable()
  public usersInChat: User[];
}
