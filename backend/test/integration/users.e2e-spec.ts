import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Gender } from '../../src/users/entities/user.entity';
import { createTestingModule } from '../test-module.factory';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;
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
        firstName: 'Test',
        lastName: 'User',
      });

    accessToken = registerResponse.body.data.access_token;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    if (mongod) await mongod.stop();
    await app.close();
  });

  describe('GET /api/users/profile/me', () => {
    it('should return the current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/profile/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.firstName).toBe('Test');
      expect(response.body.data.lastName).toBe('User');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/users/profile/me')
        .expect(401);  // Unauthorized
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID if it is the current user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should fail when accessing another user profile', async () => {
      // 先创建另一个用户
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'another@example.com',
          username: 'anotheruser',
          password: 'Password123!',
        });

      const anotherUserId = registerResponse.body.data.user.id;

      // 尝试获取其他用户资料
      await request(app.getHttpServer())
        .get(`/api/users/${anotherUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);  // Forbidden
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        gender: Gender.MALE,
        height: 180,
        weight: 75,
        bodyFatPercentage: 15.5,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
      expect(response.body.data.gender).toBe(updateData.gender);
      expect(response.body.data.height).toBe(updateData.height);
      expect(response.body.data.weight).toBe(updateData.weight);
      expect(response.body.data.bodyFatPercentage).toBe(updateData.bodyFatPercentage);
    });

    it('should fail to update email to an existing one', async () => {
      // 先创建另一个用户
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'unique@example.com',
          username: 'uniqueuser',
          password: 'Password123!',
        });

      // 尝试将电子邮件更新为已存在的电子邮件
      await request(app.getHttpServer())
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'unique@example.com',
        })
        .expect(409);  // Conflict
    });

    it('should fail when updating with invalid data', async () => {
      await request(app.getHttpServer())
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'invalid-email',
          bodyFatPercentage: 101,  // 超过100%
        })
        .expect(400);  // Bad Request
    });
  });
});