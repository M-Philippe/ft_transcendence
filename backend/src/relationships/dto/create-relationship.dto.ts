import { IsEnum, IsNumberString } from "class-validator";
import { RelationshipStatus } from "../entities/relationship.entity";

export class CreateRelationshipDto {
    @IsNumberString()
    requesterId: string;

    @IsNumberString()
    requesteeId: string;

    @IsEnum(RelationshipStatus)
    status: RelationshipStatus;
}
