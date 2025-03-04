import { IsOptional, IsEnum, IsDate, IsObject, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { GoalType } from '../entities/fitness-goal.entity';

export class UpdateFitnessGoalDto {
  @IsOptional()
  title?: string;
  
  @IsOptional()
  description?: string;
  
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  targetDate?: Date;
  
  @IsOptional()
  @IsEnum(GoalType)
  type?: GoalType;
  
  @IsOptional()
  @IsObject()
  metrics?: any;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
  
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}