import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/services/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  // 创建依赖服务的模拟对象
  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    validatePassword: jest.fn(),
    updateLastLogin: jest.fn(),
    create: jest.fn(),
  };
  
  const mockJwtService = {
    sign: jest.fn(() => 'test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});