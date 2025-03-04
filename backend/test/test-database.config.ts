import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { DefaultNamingStrategy } from 'typeorm';

// 使用默认命名策略
class SQLiteCompatibleNamingStrategy extends DefaultNamingStrategy {}

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [join(__dirname, '../src/**/*.entity{.ts,.js}')],
  synchronize: true,
  dropSchema: true,
  logging: false,
  namingStrategy: new SQLiteCompatibleNamingStrategy()
};