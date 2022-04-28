import { PickType } from '@nestjs/mapped-types';
import { CreateRelationshipDto } from './create-relationship.dto';

export class UpdateRelationshipDto extends PickType(CreateRelationshipDto, ["status"] as const){}
