import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum RelationshipStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REFUSED = "refused",
    BLOCKED_REQUESTER = "blockedRequester",
    BLOCKED_REQUESTEE = "blockedRequestee",
}

@Entity()
export class Relationship {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, user => user.requestedRelationships, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    requester: User;

    @ManyToOne(() => User, user => user.requesteeRelationships, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    requestee: User;

    @Column({default: RelationshipStatus.PENDING})
    status: string;
}
