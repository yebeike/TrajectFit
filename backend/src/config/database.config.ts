// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  mysql: {
    type: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USERNAME || 'trajectfit_user',
    password: process.env.MYSQL_PASSWORD || 'trajectfit_password',
    database: process.env.MYSQL_DATABASE || 'trajectfit',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:adminpassword@localhost:27017/trajectfit',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    // port: parseInt(process.env.REDIS_PORT || '6379', 10),
    port: parseInt(process.env.REDIS_PORT || '6380', 10),  // 更改为6380
  },
}));