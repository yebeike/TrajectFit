// backend/test/integration/auth.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { createTestingModule } from '../test-module.factory';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('AuthController (e2e)', () => {
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
  });

  afterAll(async () => {
    if (mongod) await mongod.stop();
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.access_token).toBeDefined();
      
      // 保存令牌和用户ID以供后续测试使用
      accessToken = response.body.data.access_token;
      userId = response.body.data.user.id;
      
      // 验证返回的用户数据
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.firstName).toBe('Test');
      expect(response.body.data.user.lastName).toBe('User');
      // 确保密码未返回
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail to register with duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'anotheruser',
          password: 'Password123!',
        })
        .expect(409);  // Conflict

      expect(response.body.message).toContain('Email or username already exists');
    });

    it('should fail to register with invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'te', // too short
          password: '123', // too short
        })
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.access_token).toBeDefined();
      
      accessToken = response.body.data.access_token;
    });

    it('should fail to login with incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);  // Unauthorized
    });

    it('should fail to login with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);  // Unauthorized
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.username).toBe('testuser');
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);  // Unauthorized
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);  // Unauthorized
    });
  });

  describe('GET /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.access_token).toBeDefined();
      
      // 更新令牌
      const newToken = response.body.data.access_token;
      expect(newToken).not.toBe(accessToken);
      accessToken = newToken;
    });
  });
});
