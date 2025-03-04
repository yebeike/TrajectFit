import { 
    Controller, Get, Post, Body, Patch, Param, Delete, 
    UseGuards, Request, ForbiddenException 
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { FitnessGoalsService } from '../services/fitness-goals.service';
  import { CreateFitnessGoalDto } from '../dto/create-fitness-goal.dto';
  import { UpdateFitnessGoalDto } from '../dto/update-fitness-goal.dto';
  
  @Controller('fitness-goals')
  @UseGuards(JwtAuthGuard)
  export class FitnessGoalsController {
    constructor(private readonly fitnessGoalsService: FitnessGoalsService) {}
  
    @Post()
    create(@Body() createGoalDto: CreateFitnessGoalDto, @Request() req) {
      return this.fitnessGoalsService.create(req.user.id, createGoalDto);
    }
  
    @Get()
    findAll(@Request() req) {
      return this.fitnessGoalsService.findAllByUserId(req.user.id);
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
      const goal = await this.fitnessGoalsService.findOne(id);
      
      // 检查目标是否属于该用户
      if (goal.userId !== req.user.id) {
        throw new ForbiddenException('You do not have permission to access this goal');
      }
      
      return goal;
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateGoalDto: UpdateFitnessGoalDto, @Request() req) {
      return this.fitnessGoalsService.update(id, req.user.id, updateGoalDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
      return this.fitnessGoalsService.remove(id, req.user.id);
    }
  
    @Patch(':id/progress')
    updateProgress(@Param('id') id: string, @Body('progress') progress: number, @Request() req) {
      return this.fitnessGoalsService.updateProgress(id, req.user.id, progress);
    }
  }