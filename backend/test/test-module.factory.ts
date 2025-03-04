import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { testDatabaseConfig } from './test-database.config';
import { modifyEntityMetadataForSqlite } from './entity-metadata-modifier';
import { HttpExceptionFilter } from '../src/core/filters/http-exception.filter';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor';
import appConfig from '../src/config/app.config';
import databaseConfig from '../src/config/database.config';

// 在导入前修改元数据
modifyEntityMetadataForSqlite();

export async function createTestingModule(imports: any[] = []) {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [appConfig, databaseConfig],
      }),
      TypeOrmModule.forRoot(testDatabaseConfig),
      ...imports,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // 设置全局过滤器和拦截器
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  
  app.setGlobalPrefix('api');
  
  await app.init();
  
  return { app, moduleFixture };
}