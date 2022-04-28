import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    avatar: string;

}

export class CreateUserLocalDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class CreateUSer42Dto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    id42: number;

    @IsString()
    avatar: string;
}
