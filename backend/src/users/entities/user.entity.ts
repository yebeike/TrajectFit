import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { FitnessGoal } from './fitness-goal.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ 
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum', 
    enum: Gender 
  })
  gender: Gender;

  @Column({ nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  height: number; // 身高(cm)

  @Column({ nullable: true })
  weight: number; // 体重(kg)

  @Column({ nullable: true })
  bodyFatPercentage: number; // 体脂率(%)

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => FitnessGoal, goal => goal.user)
  fitnessGoals: FitnessGoal[];
}