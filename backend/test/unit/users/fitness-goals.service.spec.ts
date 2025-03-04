// backend/test/unit/users/fitness-goals.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { FitnessGoalsService } from '../../../src/users/services/fitness-goals.service';
import { FitnessGoal, GoalType } from '../../../src/users/entities/fitness-goal.entity';

const mockFitnessGoalRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('FitnessGoalsService', () => {
  let service: FitnessGoalsService;
  let repository: Repository<FitnessGoal>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FitnessGoalsService,
        {
          provide: getRepositoryToken(FitnessGoal),
          useFactory: mockFitnessGoalRepository,
        },
      ],
    }).compile();

    service = module.get<FitnessGoalsService>(FitnessGoalsService);
    repository = module.get<Repository<FitnessGoal>>(getRepositoryToken(FitnessGoal));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new fitness goal', async () => {
      const userId = 'user-id';
      const createGoalDto = {
        title: 'Lose Weight',
        description: 'Lose 5kg in 3 months',
        targetDate: new Date('2023-12-31'),
        type: GoalType.WEIGHT_LOSS,
        metrics: { targetWeight: 70 },
      };
      
      const mockGoal = {
        id: 'goal-id',
        userId,
        ...createGoalDto,
        progress: 0,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      jest.spyOn(repository, 'create').mockReturnValue(mockGoal as FitnessGoal);
      jest.spyOn(repository, 'save').mockResolvedValue(mockGoal as FitnessGoal);
      
      const result = await service.create(userId, createGoalDto);
      
      expect(repository.create).toHaveBeenCalledWith({
        ...createGoalDto,
        userId,
        progress: 0,
      });
      expect(repository.save).toHaveBeenCalledWith(mockGoal);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all fitness goals for a user', async () => {
      const userId = 'user-id';
      const mockGoals = [
        {
          id: 'goal-1',
          userId,
          title: 'Goal 1',
          type: GoalType.WEIGHT_LOSS,
        },
        {
          id: 'goal-2',
          userId,
          title: 'Goal 2',
          type: GoalType.MUSCLE_GAIN,
        },
      ];
      
      jest.spyOn(repository, 'find').mockResolvedValue(mockGoals as FitnessGoal[]);
      
      const result = await service.findAllByUserId(userId);
      
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockGoals);
    });
  });

  describe('findOne', () => {
    it('should return a fitness goal if it exists', async () => {
      const goalId = 'goal-id';
      const mockGoal = {
        id: goalId,
        userId: 'user-id',
        title: 'Test Goal',
      };
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockGoal as FitnessGoal);
      
      const result = await service.findOne(goalId);
      
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: goalId } });
      expect(result).toEqual(mockGoal);
    });

    it('should throw NotFoundException if goal does not exist', async () => {
      const goalId = 'goal-id';
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      
      await expect(service.findOne(goalId)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: goalId } });
    });
  });

  describe('update', () => {
    it('should update a fitness goal if it belongs to the user', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      const updateGoalDto = {
        title: 'Updated Goal',
        progress: 50,
      };
      
      const mockGoal = {
        id: goalId,
        userId,
        title: 'Original Goal',
        progress: 0,
      };
      
      const updatedGoal = {
        ...mockGoal,
        ...updateGoalDto,
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGoal as FitnessGoal);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedGoal as FitnessGoal);
      
      const result = await service.update(goalId, userId, updateGoalDto);
      
      expect(service.findOne).toHaveBeenCalledWith(goalId);
      expect(repository.save).toHaveBeenCalledWith({
        ...mockGoal,
        ...updateGoalDto,
      });
      expect(result).toEqual(updatedGoal);
    });

    it('should throw ForbiddenException if goal does not belong to the user', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      const updateGoalDto = {
        title: 'Updated Goal',
      };
      
      const mockGoal = {
        id: goalId,
        userId: 'different-user-id',
        title: 'Original Goal',
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGoal as FitnessGoal);
      
      await expect(service.update(goalId, userId, updateGoalDto)).rejects.toThrow(ForbiddenException);
      expect(service.findOne).toHaveBeenCalledWith(goalId);
    });
  });

  describe('remove', () => {
    it('should remove a fitness goal if it belongs to the user', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      
      const mockGoal = {
        id: goalId,
        userId,
        title: 'Goal to Delete',
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGoal as FitnessGoal);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockGoal as FitnessGoal);
      
      await service.remove(goalId, userId);
      
      expect(service.findOne).toHaveBeenCalledWith(goalId);
      expect(repository.remove).toHaveBeenCalledWith(mockGoal);
    });

    it('should throw ForbiddenException if goal does not belong to the user', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      
      const mockGoal = {
        id: goalId,
        userId: 'different-user-id',
        title: 'Goal to Delete',
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGoal as FitnessGoal);
      
      await expect(service.remove(goalId, userId)).rejects.toThrow(ForbiddenException);
      expect(service.findOne).toHaveBeenCalledWith(goalId);
    });
  });

  describe('updateProgress', () => {
    it('should update the progress of a fitness goal', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      const progress = 75;
      
      const mockGoal = {
        id: goalId,
        userId,
        title: 'Test Goal',
        progress: 50,
        completed: false,
      };
      
      const updatedGoal = {
        ...mockGoal,
        progress,
        completed: false,
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGoal as FitnessGoal);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedGoal as FitnessGoal);
      
      const result = await service.updateProgress(goalId, userId, progress);
      
      expect(service.findOne).toHaveBeenCalledWith(goalId);
      expect(repository.save).toHaveBeenCalledWith({
        ...mockGoal,
        progress,
      });
      expect(result).toEqual(updatedGoal);
    });

    it('should mark goal as completed when progress is 100%', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      const progress = 100;
      
      const mockGoal = {
        id: goalId,
        userId,
        title: 'Test Goal',
        progress: 90,
        completed: false,
      };
      
      const updatedGoal = {
        ...mockGoal,
        progress,
        completed: true,
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGoal as FitnessGoal);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedGoal as FitnessGoal);
      
      const result = await service.updateProgress(goalId, userId, progress);
      
      expect(repository.save).toHaveBeenCalledWith({
        ...mockGoal,
        progress,
        completed: true,
      });
      expect(result.completed).toBe(true);
    });

    it('should throw ForbiddenException if goal does not belong to the user', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      const progress = 80;
      
      const mockGoal = {
        id: goalId,
        userId: 'different-user-id',
        title: 'Test Goal',
        progress: 50,
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGoal as FitnessGoal);
      
      await expect(service.updateProgress(goalId, userId, progress)).rejects.toThrow(ForbiddenException);
    });
  });
});
