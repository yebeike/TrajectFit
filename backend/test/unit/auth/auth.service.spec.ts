// backend/test/unit/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../src/auth/auth.service';
import { UsersService } from '../../../src/users/services/users.service';
import { User, UserRole } from '../../../src/users/entities/user.entity';
import { UserResponseDto } from '../../../src/users/dto/user-response.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    validatePassword: jest.fn(),
    create: jest.fn(),
    updateLastLogin: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return a user if credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedPassword',
      };
      
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      
      const result = await service.validateUser('test@test.com', 'password');
      
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      
      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedPassword',
      };
      
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);
      
      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith('password', 'hashedPassword');
    });
  });

  describe('login', () => {
    it('should return user and access token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        username: 'test',
        role: UserRole.USER,
      };
      
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      
      const result = await service.login(mockUser as User);
      
      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith('1');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        email: 'test@test.com',
        username: 'test',
        role: UserRole.USER,
      });
      
      expect(result).toEqual({
        user: expect.any(UserResponseDto),
        access_token: 'test-token',
      });
    });
  });

  describe('register', () => {
    it('should create a user and return user and access token', async () => {
      const createUserDto = {
        email: 'test@test.com',
        username: 'test',
        password: 'password123',
      };
      
      const mockUser = {
        id: '1',
        ...createUserDto,
        role: UserRole.USER,
      };
      
      mockUsersService.create.mockResolvedValue(mockUser);
      
      const result = await service.register(createUserDto);
      
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        email: 'test@test.com',
        username: 'test',
        role: UserRole.USER,
      });
      
      expect(result).toEqual({
        user: expect.any(UserResponseDto),
        access_token: 'test-token',
      });
    });
  });

  describe('refreshToken', () => {
    it('should return a new access token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        username: 'test',
        role: UserRole.USER,
      };
      
      mockUsersService.findById.mockResolvedValue(mockUser);
      
      const result = await service.refreshToken('1');
      
      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        email: 'test@test.com',
        username: 'test',
        role: UserRole.USER,
      });
      
      expect(result).toEqual({
        access_token: 'test-token',
      });
    });
  });
});
