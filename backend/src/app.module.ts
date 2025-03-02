// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { createClient } from 'redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { CoreModule } from './core/core.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    
    // MySQL数据库连接
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database.mysql'),
        autoLoadEntities: true,
      }),
    }),
    
    // MongoDB数据库连接
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('database.mongodb.uri'),
      }),
    }),
    
    // 缓存模块
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get('database.redis');
        
        return {
          // 使用内存缓存代替Redis缓存
          // 如果需要Redis，稍后可以再解决这个问题
          ttl: 600, // 默认缓存10分钟
        };
      },
    }),
    
    // 应用模块
    CoreModule,
    SharedModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}