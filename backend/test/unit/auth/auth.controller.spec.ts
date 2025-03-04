// backend/test/unit/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { UserRole } from '../../../src/users/entities/user.entity';
import { UserResponseDto } from '../../../src/users/dto/user-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };
      
      const mockUser = {
        id: 'user-id',
        ...createUserDto,
        password: 'hashed-password',
        role: UserRole.USER,
      };
      
      const mockResponse = {
        user: new UserResponseDto(mockUser),
        access_token: 'jwt-token',
      };
      
      mockAuthService.register.mockResolvedValue(mockResponse);
      
      const result = await controller.register(createUserDto);
      
      expect(authService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockResponse);
      expect(result.user).toBeInstanceOf(UserResponseDto);
      expect(result.access_token).toBeDefined();
    });
  });

  describe('login', () => {
    it('should log in a user', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.USER,
      };
      
      const mockResponse = {
        user: new UserResponseDto(mockUser),
        access_token: 'jwt-token',
      };
      
      const req = { user: mockUser };
      
      mockAuthService.login.mockResolvedValue(mockResponse);
      
      const result = await controller.login(req);
      
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockResponse);
      expect(result.user).toBeInstanceOf(UserResponseDto);
      expect(result.access_token).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should refresh the access token', async () => {
      const mockUser = {
        id: 'user-id',
      };
      
      const mockResponse = {
        access_token: 'new-jwt-token',
      };
      
      const req = { user: mockUser };
      
      mockAuthService.refreshToken.mockResolvedValue(mockResponse);
      
      const result = await controller.refreshToken(req);
      
      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBeDefined();
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
      };
      
      const req = { user: mockUser };
      
      const result = controller.getProfile(req);
      
      expect(result).toEqual(mockUser);
    });
  });
});
