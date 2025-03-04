import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Gender } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  birthDate?: Date;
}