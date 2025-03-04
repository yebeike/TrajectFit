import { IsNotEmpty, IsEnum, IsOptional, IsDate, IsObject, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { GoalType } from '../entities/fitness-goal.entity';

export class CreateFitnessGoalDto {
  @IsNotEmpty()
  title: string;
  
  @IsOptional()
  description?: string;
  
  @IsDate()
  @Type(() => Date)
  targetDate: Date;
  
  @IsEnum(GoalType)
  type: GoalType;
  
  @IsOptional()
  @IsObject()
  metrics?: any;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}