import { Exclude, Expose, Transform } from 'class-transformer';
import { User, Gender, UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  @Transform(({ value }) => value && value.toString())
  gender: Gender;

  @Expose()
  birthDate: Date;

  @Expose()
  avatarUrl: string;

  @Expose()
  height: number;

  @Expose()
  weight: number;

  @Expose()
  bodyFatPercentage: number;

  @Expose()
  role: UserRole;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}