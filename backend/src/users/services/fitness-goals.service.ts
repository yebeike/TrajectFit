import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FitnessGoal } from '../entities/fitness-goal.entity';
import { CreateFitnessGoalDto } from '../dto/create-fitness-goal.dto';
import { UpdateFitnessGoalDto } from '../dto/update-fitness-goal.dto';

@Injectable()
export class FitnessGoalsService {
  constructor(
    @InjectRepository(FitnessGoal)
    private fitnessGoalRepository: Repository<FitnessGoal>,
  ) {}

  // 创建健身目标
  async create(userId: string, createGoalDto: CreateFitnessGoalDto): Promise<FitnessGoal> {
    const goal = this.fitnessGoalRepository.create({
      ...createGoalDto,
      userId,
      progress: createGoalDto.progress || 0,
    });
    
    return this.fitnessGoalRepository.save(goal);
  }

  // 获取用户所有目标
  async findAllByUserId(userId: string): Promise<FitnessGoal[]> {
    return this.fitnessGoalRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // 获取单个目标
  async findOne(id: string): Promise<FitnessGoal> {
    const goal = await this.fitnessGoalRepository.findOne({ where: { id } });
    
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }
    
    return goal;
  }

  // 更新目标
  async update(id: string, userId: string, updateGoalDto: UpdateFitnessGoalDto): Promise<FitnessGoal> {
    const goal = await this.findOne(id);
    
    // 检查目标是否属于该用户
    if (goal.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this goal');
    }
    
    Object.assign(goal, updateGoalDto);
    
    return this.fitnessGoalRepository.save(goal);
  }

  // 删除目标
  async remove(id: string, userId: string): Promise<void> {
    const goal = await this.findOne(id);
    
    // 检查目标是否属于该用户
    if (goal.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this goal');
    }
    
    await this.fitnessGoalRepository.remove(goal);
  }

  // 更新目标进度
  async updateProgress(id: string, userId: string, progress: number): Promise<FitnessGoal> {
    const goal = await this.findOne(id);
    
    // 检查目标是否属于该用户
    if (goal.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this goal');
    }
    
    goal.progress = progress;
    
    // 如果进度达到100%，自动将目标标记为已完成
    if (progress >= 100) {
      goal.completed = true;
    }
    
    return this.fitnessGoalRepository.save(goal);
  }
}