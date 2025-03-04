import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum GoalType {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  FLEXIBILITY = 'flexibility',
  CUSTOM = 'custom',
}

@Entity('fitness_goals')
export class FitnessGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @ManyToOne(() => User, user => user.fitnessGoals)
  user: User;
  
  @Column()
  userId: string;
  
  @Column()
  title: string;
  
  @Column({ type: 'text', nullable: true })
  description: string;
  
  @Column({ type: 'date' })
  targetDate: Date;
  
  @Column({ default: false })
  completed: boolean;
  
  @Column({ 
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum', 
    enum: GoalType 
  })
  type: GoalType;
  
  @Column({ type: 'json', nullable: true })
  metrics: any;
  
  @Column({ type: 'float', nullable: true })
  progress: number;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}