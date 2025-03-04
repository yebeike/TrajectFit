// backend/test/unit/users/users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersController } from '../../../src/users/controllers/users.controller';
import { UsersService } from '../../../src/users/services/users.service';
import { UserRole } from '../../../src/users/entities/user.entity';
import { UserResponseDto } from '../../../src/users/dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUsersService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };
      
      const mockUser = {
        id: 'user-id',
        ...createUserDto,
        password: 'hashed-password',
      };
      
      mockUsersService.create.mockResolvedValue(mockUser);
      
      const result = await controller.create(createUserDto);
      
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toEqual(mockUser.id);
      expect(result.email).toEqual(mockUser.email);
      expect(result.username).toEqual(mockUser.username);
    //   expect(result.password).toBeUndefined(); // 确保密码被排除
      expect(result).not.toHaveProperty('password'); // 确保密码被排除
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        { id: 'user-2', username: 'user2', email: 'user2@example.com' },
      ];
      
      mockUsersService.findAll.mockResolvedValue(mockUsers);
      
      const result = await controller.findAll();
      
      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserResponseDto);
      expect(result[1]).toBeInstanceOf(UserResponseDto);
    });
  });

  describe('findOne', () => {
    it('should return a user if it is the requesting user', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
      };
      
      const req = { user: { id: userId, role: UserRole.USER } };
      
      mockUsersService.findById.mockResolvedValue(mockUser);
      
      const result = await controller.findOne(userId, req);
      
      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toEqual(userId);
    });

    it('should return a user if requester is an admin', async () => {
      const userId = 'user-id';
      const adminId = 'admin-id';
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
      };
      
      const req = { user: { id: adminId, role: UserRole.ADMIN } };
      
      mockUsersService.findById.mockResolvedValue(mockUser);
      
      const result = await controller.findOne(userId, req);
      
      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it('should throw ForbiddenException if user tries to access another user profile', async () => {
      const userId = 'user-id';
      const anotherUserId = 'another-user-id';
      
      const req = { user: { id: anotherUserId, role: UserRole.USER } };
      
      await expect(controller.findOne(userId, req)).rejects.toThrow(ForbiddenException);
      expect(usersService.findById).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user if it is the requesting user', async () => {
      const userId = 'user-id';
      const updateUserDto = { firstName: 'Updated', lastName: 'User' };
      
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        ...updateUserDto,
      };
      
      const req = { user: { id: userId, role: UserRole.USER } };
      
      mockUsersService.update.mockResolvedValue(mockUser);
      
      const result = await controller.update(userId, updateUserDto, req);
      
      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.firstName).toEqual(updateUserDto.firstName);
      expect(result.lastName).toEqual(updateUserDto.lastName);
    });

    it('should update user if requester is an admin', async () => {
      const userId = 'user-id';
      const adminId = 'admin-id';
      const updateUserDto = { firstName: 'Updated', lastName: 'User' };
      
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        ...updateUserDto,
      };
      
      const req = { user: { id: adminId, role: UserRole.ADMIN } };
      
      mockUsersService.update.mockResolvedValue(mockUser);
      
      const result = await controller.update(userId, updateUserDto, req);
      
      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it('should throw ForbiddenException if user tries to update another user', async () => {
      const userId = 'user-id';
      const anotherUserId = 'another-user-id';
      const updateUserDto = { firstName: 'Updated', lastName: 'User' };
      
      const req = { user: { id: anotherUserId, role: UserRole.USER } };
      
      await expect(controller.update(userId, updateUserDto, req)).rejects.toThrow(ForbiddenException);
      expect(usersService.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user if requester is admin', async () => {
      const userId = 'user-id';
      const req = { user: { id: 'admin-id', role: UserRole.ADMIN } };
      
      mockUsersService.remove.mockResolvedValue(undefined);
      
      const result = await controller.remove(userId);
      
      expect(usersService.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });
  });

  describe('getMyProfile', () => {
    it('should return the profile of the requesting user', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
      };
      
      const req = { user: { id: userId } };
      
      mockUsersService.findById.mockResolvedValue(mockUser);
      
      const result = await controller.getMyProfile(req);
      
      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toEqual(userId);
    });
  });
});