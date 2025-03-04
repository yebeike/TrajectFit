import { IsEmail, IsOptional, MinLength, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Gender } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  avatarUrl?: string;

  @IsOptional()
  username?: string;

  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  birthDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyFatPercentage?: number;
}