// backend/test/unit/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../src/users/services/users.service';
import { User, Gender, UserRole } from '../../../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt methods
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockUserRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        { id: '1', username: 'test1', email: 'test1@test.com' },
        { id: '2', username: 'test2', email: 'test2@test.com' },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(mockUsers as User[]);
      
      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user when user exists', async () => {
      const mockUser = { id: '1', username: 'test', email: 'test@test.com' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser as User);
      
      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      
      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('findByUsername', () => {
    it('should return a user when username exists', async () => {
      const mockUser = { id: '1', username: 'test', email: 'test@test.com' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser as User);
      
      const result = await service.findByUsername('test');
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { username: 'test' } });
    });

    it('should throw NotFoundException when username does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      
      await expect(service.findByUsername('test')).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { username: 'test' } });
    });
  });

  describe('findByEmail', () => {
    it('should return a user when email exists', async () => {
      const mockUser = { id: '1', username: 'test', email: 'test@test.com' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser as User);
      
      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@test.com',
        username: 'test',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };
      
      const mockUser = {
        id: '1',
        ...createUserDto,
        password: 'hashedPassword',
        role: UserRole.USER,
        isActive: true
      };
      
      jest.spyOn(service, 'checkUserExists').mockResolvedValue(false);
      jest.spyOn(repository, 'create').mockReturnValue(mockUser as User);
      jest.spyOn(repository, 'save').mockResolvedValue(mockUser as User);
      
      const result = await service.create(createUserDto);
      
      expect(service.checkUserExists).toHaveBeenCalledWith('test@test.com', 'test');
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(repository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email or username exists', async () => {
      const createUserDto = {
        email: 'test@test.com',
        username: 'test',
        password: 'password123'
      };
      
      jest.spyOn(service, 'checkUserExists').mockResolvedValue(true);
      
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(service.checkUserExists).toHaveBeenCalledWith('test@test.com', 'test');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        username: 'test',
        password: 'oldPassword',
      };
      
      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
        height: 180
      };
      
      const updatedUser = {
        ...mockUser,
        ...updateUserDto
      };
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser as User);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedUser as User);
      
      const result = await service.update('1', updateUserDto);
      
      expect(service.findById).toHaveBeenCalledWith('1');
      expect(repository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserDto
      });
      expect(result).toEqual(updatedUser);
    });

    it('should hash password when updating password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        username: 'test',
        password: 'oldPassword',
      };
      
      const updateUserDto = {
        password: 'newPassword'
      };
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser as User);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword'
      } as User);
      
      await service.update('1', updateUserDto);
      
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 'salt');
      expect(repository.save).toHaveBeenCalledWith({
        ...mockUser,
        password: 'hashedPassword'
      });
    });

    it('should throw ConflictException when updating to an existing email', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        username: 'test',
      };
      
      const updateUserDto = {
        email: 'existing@test.com'
      };
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser as User);
      jest.spyOn(repository, 'findOne').mockResolvedValue({ id: '2' } as User);
      
      await expect(service.update('1', updateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1, raw: [] });
      
      await service.remove('1');
      
      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 0, raw: [] });
      
      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
      expect(repository.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('validatePassword', () => {
    it('should return true when password is valid', async () => {
      const result = await service.validatePassword('password', 'hashedPassword');
      
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(result).toBeTruthy();
    });

    it('should return false when password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      const result = await service.validatePassword('password', 'hashedPassword');
      
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(result).toBeFalsy();
    });
  });
});
