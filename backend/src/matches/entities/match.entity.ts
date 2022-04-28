import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Match {
	@PrimaryGeneratedColumn()
	id! : number;

	@CreateDateColumn({ nullable: false })
	date!: Date;

	@Column({ nullable: false })
	winner!: string;

	@Column({ nullable: false })
	player1!: string;

	@Column({ nullable: false })
	player2!: string;

	@ManyToMany(() => User, user => user.matches, { cascade: true })
	@JoinTable()
	users!: User[];
}
