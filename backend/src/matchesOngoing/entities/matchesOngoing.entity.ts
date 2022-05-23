import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

interface Players {
  username: string,
  palletAssigned: 0 | 1,
  socket: string,
}

@Entity()
export class MatchesOnGoing {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column() pending: boolean;
  @Column() finishedGame: boolean;

  @Column("text") bakckgroundColor: string;
  @Column("text") objectColor: string;


  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'{}'",
    nullable: false
  }) players: Array<Players>;

  @Column("text", { array: true }) socketsToEmit: string[];

  @Column({ type: 'decimal', precision: 6, scale: 2}) puckX: number;
  @Column({ type: 'decimal', precision: 6, scale: 2}) puckY: number;
  @Column({ type: 'decimal', precision: 6, scale: 2}) puckVX: number;
  @Column({ type: 'decimal', precision: 6, scale: 2}) puckVY: number;

  @Column("int") palletAX: number;
  @Column("int") palletAY: number;
  @Column("int") palletAWidth: number;
  @Column("int") palletAHeight: number;
  @Column("int") palletAXFromUser: number;
  @Column("int") palletayfromuser: number;

  @Column("int") palletBX: number;
  @Column("int") palletBY: number;
  @Column("int") palletBWidth: number;
  @Column("int") palletBHeight: number;
  @Column("int") palletBXFromUser: number;
  @Column("int") palletbyfromuser: number;

  @Column("int") puckWidth: number;
  @Column("int") puckHeight: number;

  @Column() generatePowerUp: boolean;
  @Column() powerUpInvisible: boolean;
  @Column() powerUpShrink: boolean;
  @Column("int") powerUpX: number;
  @Column("int") powerUpY: number;
  @Column("int") powerUpWidth: number;
  @Column("int") powerUpHeight: number;
  @Column("int") powerUpState: number;

  @Column("int") width: number;
  @Column("int") height: number;

  @Column() scoreMax: number;
  @Column("int") scorePlayerA: number;
  @Column("int") scorePlayerB: number;

  @Column("text") p1: string;
  @Column("text") p2: string;

  @Column() playerDisconnected: boolean;
  @Column("text") usernameDisconnectedPlayer: string;
  @Column("bigint") timeOfDisconnection: number;

  @Column("text") winnerUsername: string;
  @Column() hasMessageToDisplay: boolean;
  @Column("text") messageToDisplay: string;
}
