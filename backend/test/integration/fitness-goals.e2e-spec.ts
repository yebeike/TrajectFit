// backend/test/integration/fitness-goals.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { GoalType } from '../../src/users/entities/fitness-goal.entity';
import { createTestingModule } from '../test-module.factory';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('FitnessGoalsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;
  let goalId: string;
  
  // 为第二个用户创建的变量
  let anotherAccessToken: string;
  let anotherUserId: string;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // 启动MongoDB内存服务器
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    
    // 覆盖.env中的MongoDB连接
    process.env.MONGODB_URI = mongoUri;
    
    // 使用我们创建的测试模块工厂
    const testModule = await createTestingModule([AppModule]);
    app = testModule.app;

    // 注册测试用户
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      });

    accessToken = registerResponse.body.data.access_token;
    userId = registerResponse.body.data.user.id;

    // 注册第二个测试用户
    const anotherRegisterResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'another@example.com',
        username: 'anotheruser',
        password: 'Password123!',
      });

    anotherAccessToken = anotherRegisterResponse.body.data.access_token;
    anotherUserId = anotherRegisterResponse.body.data.user.id;
  });

  afterAll(async () => {
    if (mongod) await mongod.stop();
    await app.close();
  });

  describe('POST /api/fitness-goals', () => {
    it('should create a new fitness goal', async () => {
      const createGoalDto = {
        title: 'Lose Weight',
        description: 'Lose 5kg in 3 months',
        targetDate: new Date('2023-12-31').toISOString(),
        type: GoalType.WEIGHT_LOSS,
        metrics: { targetWeight: 70 },
      };

      const response = await request(app.getHttpServer())
        .post('/api/fitness-goals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createGoalDto)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(createGoalDto.title);
      expect(response.body.data.description).toBe(createGoalDto.description);
      expect(response.body.data.type).toBe(createGoalDto.type);
      expect(response.body.data.metrics).toEqual(createGoalDto.metrics);
      expect(response.body.data.progress).toBe(0);
      expect(response.body.data.completed).toBe(false);
      expect(response.body.data.userId).toBe(userId);
      
      // 保存目标ID用于后续测试
      goalId = response.body.data.id;
    });

    it('should fail to create a goal with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/fitness-goals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // 缺少必要字段
          description: 'Incomplete goal',
        })
        .expect(400);  // Bad Request
    });
  });

  describe('GET /api/fitness-goals', () => {
    it('should return all fitness goals for the user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fitness-goals')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].userId).toBe(userId);
    });

    it('should return empty array if user has no goals', async () => {
      // 使用另一个没有创建目标的用户
      const response = await request(app.getHttpServer())
        .get('/api/fitness-goals')
        .set('Authorization', `Bearer ${anotherAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/fitness-goals/:id', () => {
    it('should return a fitness goal by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/fitness-goals/${goalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(goalId);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should fail when accessing goal of another user', async () => {
      await request(app.getHttpServer())
        .get(`/api/fitness-goals/${goalId}`)
        .set('Authorization', `Bearer ${anotherAccessToken}`)
        .expect(403);  // Forbidden
    });

    it('should fail with non-existent goal ID', async () => {
      await request(app.getHttpServer())
        .get('/api/fitness-goals/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);  // Not Found
    });
  });

  describe('PATCH /api/fitness-goals/:id', () => {
    it('should update a fitness goal', async () => {
      const updateGoalDto = {
        title: 'Updated Goal',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/fitness-goals/${goalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateGoalDto)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(goalId);
      expect(response.body.data.title).toBe(updateGoalDto.title);
      expect(response.body.data.description).toBe(updateGoalDto.description);
    });

    it('should fail when updating goal of another user', async () => {
      await request(app.getHttpServer())
        .patch(`/api/fitness-goals/${goalId}`)
        .set('Authorization', `Bearer ${anotherAccessToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);  // Forbidden
    });
  });

  describe('PATCH /api/fitness-goals/:id/progress', () => {
    it('should update progress of a fitness goal', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/fitness-goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ progress: 50 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(goalId);
      expect(response.body.data.progress).toBe(50);
      expect(response.body.data.completed).toBe(false);
    });

    it('should mark goal as completed when progress reaches 100%', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/fitness-goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ progress: 100 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.progress).toBe(100);
      expect(response.body.data.completed).toBe(true);
    });

    it('should fail when updating progress for goal of another user', async () => {
      await request(app.getHttpServer())
        .patch(`/api/fitness-goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${anotherAccessToken}`)
        .send({ progress: 75 })
        .expect(403);  // Forbidden
    });
  });

  describe('DELETE /api/fitness-goals/:id', () => {
    it('should fail when deleting goal of another user', async () => {
      await request(app.getHttpServer())
        .delete(`/api/fitness-goals/${goalId}`)
        .set('Authorization', `Bearer ${anotherAccessToken}`)
        .expect(403);  // Forbidden
    });

    it('should delete a fitness goal', async () => {
      await request(app.getHttpServer())
        .delete(`/api/fitness-goals/${goalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 验证目标确实已被删除
      await request(app.getHttpServer())
        .get(`/api/fitness-goals/${goalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);  // Not Found
    });
  });
});