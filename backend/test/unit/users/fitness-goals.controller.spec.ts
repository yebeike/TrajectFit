// backend/test/unit/users/fitness-goals.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { FitnessGoalsController } from '../../../src/users/controllers/fitness-goals.controller';
import { FitnessGoalsService } from '../../../src/users/services/fitness-goals.service';
import { GoalType } from '../../../src/users/entities/fitness-goal.entity';

describe('FitnessGoalsController', () => {
  let controller: FitnessGoalsController;
  let service: FitnessGoalsService;

  const mockFitnessGoalsService = {
    create: jest.fn(),
    findAllByUserId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FitnessGoalsController],
      providers: [
        { provide: FitnessGoalsService, useValue: mockFitnessGoalsService },
      ],
    }).compile();

    controller = module.get<FitnessGoalsController>(FitnessGoalsController);
    service = module.get<FitnessGoalsService>(FitnessGoalsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
      };
      
      const req = { user: { id: userId } };
      
      mockFitnessGoalsService.create.mockResolvedValue(mockGoal);
      
      const result = await controller.create(createGoalDto, req);
      
      expect(service.create).toHaveBeenCalledWith(userId, createGoalDto);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('findAll', () => {
    it('should return all fitness goals for the user', async () => {
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
      
      const req = { user: { id: userId } };
      
      mockFitnessGoalsService.findAllByUserId.mockResolvedValue(mockGoals);
      
      const result = await controller.findAll(req);
      
      expect(service.findAllByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockGoals);
    });
  });

  describe('findOne', () => {
    it('should return a fitness goal if it belongs to the user', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      
      const mockGoal = {
        id: goalId,
        userId,
        title: 'Test Goal',
      };
      
      const req = { user: { id: userId } };
      
      mockFitnessGoalsService.findOne.mockResolvedValue(mockGoal);
      
      const result = await controller.findOne(goalId, req);
      
      expect(service.findOne).toHaveBeenCalledWith(goalId);
      expect(result).toEqual(mockGoal);
    });

    it('should throw ForbiddenException if goal does not belong to the user', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      
      const mockGoal = {
        id: goalId,
        userId: 'different-user-id',
        title: 'Test Goal',
      };
      
      const req = { user: { id: userId } };
      
      mockFitnessGoalsService.findOne.mockResolvedValue(mockGoal);
      
      await expect(controller.findOne(goalId, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a fitness goal', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      const updateGoalDto = {
        title: 'Updated Goal',
        progress: 50,
      };
      
      const mockGoal = {
        id: goalId,
        userId,
        title: 'Updated Goal',
        progress: 50,
      };
      
      const req = { user: { id: userId } };
      
      mockFitnessGoalsService.update.mockResolvedValue(mockGoal);
      
      const result = await controller.update(goalId, updateGoalDto, req);
      
      expect(service.update).toHaveBeenCalledWith(goalId, userId, updateGoalDto);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('remove', () => {
    it('should remove a fitness goal', async () => {
      const goalId = 'goal-id';
      const userId = 'user-id';
      const req = { user: { id: userId } };
      
      mockFitnessGoalsService.remove.mockResolvedValue(undefined);
      
      await controller.remove(goalId, req);
      
      expect(service.remove).toHaveBeenCalledWith(goalId, userId);
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
        progress: 75,
      };
      
      const req = { user: { id: userId } };
      
      mockFitnessGoalsService.updateProgress.mockResolvedValue(mockGoal);
      
      const result = await controller.updateProgress(goalId, progress, req);
      
      expect(service.updateProgress).toHaveBeenCalledWith(goalId, userId, progress);
      expect(result).toEqual(mockGoal);
      expect(result.progress).toEqual(progress);
    });
  });
});
