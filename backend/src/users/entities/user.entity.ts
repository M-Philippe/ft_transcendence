import { Chat } from "src/chat/entities/chat.entity";
import { Match } from "src/matches/entities/match.entity";
import { password } from "src/passwordEncryption/passwordEncryption";
import { Relationship } from "src/relationships/entities/relationship.entity";
import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { UserAlert } from "../users.types";

@Entity()
@Unique(['id', 'name'])
export class User {
    @PrimaryGeneratedColumn()
    public id: number;

    /*
    **  INFOS_USER
    */
    @Column({ unique: true })
    public name: string;

    @Column({
      type: "jsonb",
      default: () => "'{}'",
      nullable: true,
    })
    password: password | undefined;

    @Column({ default: false })
    public hasAlreadyChanged42Name: boolean;

		@Column({ default: -1 })
    public id42: number;

    @Column()
    public avatar: string; // ?

    @Column({ nullable: false, default: false })
    public online: boolean;

    @Column({ nullable: false, default: false })
    public inGame: boolean;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

		/*
		**	AUTH
		*/
    @Column({ default: null, nullable: true })
    public twoFactorSecret?: string;

    @Column({ default: false })
    public twoFactorIsEnabled: boolean;

    /*
    **  RELATIONSHIPS
    */
    @OneToMany(() => Relationship, relationship => relationship.requester, {
        cascade: true,
        eager: true
    })
    public requestedRelationships: Relationship[];

    @OneToMany(() => Relationship, relationship => relationship.requestee, {
        cascade: true,
        eager: true,
    })
    public requesteeRelationships: Relationship[];

    /*
    **  MATCHES
    */
    @ManyToMany(() => Match, match => match.users, { onDelete: "CASCADE" })
    public matches: Match[];

    @Column({ default: 0 })
    public wonCount: number;

    @Column({ default: 0 })
    public lostCount: number;

    @Column({ default: 0 })
    public winningStreak: number;

    @Column({ type: String })
    public achievements: String;

    /*
    **  CHAT
    */
    @ManyToMany(() => Chat, chat => chat.usersInChat, {
        eager: true,
        nullable: true,
    })
    public listChat: Chat[];

    /*
    **  USER_ALERT
    */
    @Column({
      type: 'jsonb',
      array: false,
      default: () => "'{}'",
      nullable: false,
    })
    userAlert: Array<UserAlert>;

    @Column({default: ""})
    socketAlert: string;
}
