import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 查找所有用户
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // 通过ID查找用户
  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // 通过用户名查找用户
  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  // 通过邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  // 检查用户名和邮箱是否已存在
  async checkUserExists(email: string, username: string): Promise<boolean> {
    const userByEmail = await this.usersRepository.findOne({ where: { email } });
    const userByUsername = await this.usersRepository.findOne({ where: { username } });
    return !!userByEmail || !!userByUsername;
  }

  // 创建新用户
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, username, password } = createUserDto;
    
    // 检查用户是否已经存在
    const userExists = await this.checkUserExists(email, username);
    if (userExists) {
      throw new ConflictException('Email or username already exists');
    }
    
    // 密码加密
    const hashedPassword = await this.hashPassword(password);
    
    // 创建新用户
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    
    return this.usersRepository.save(newUser);
  }

  // 更新用户信息
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    // 如果更新邮箱或用户名，检查是否已存在
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUserByEmail = await this.usersRepository.findOne({ 
        where: { email: updateUserDto.email } 
      });
      if (existingUserByEmail) {
        throw new ConflictException('Email already exists');
      }
    }
    
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUserByUsername = await this.usersRepository.findOne({ 
        where: { username: updateUserDto.username } 
      });
      if (existingUserByUsername) {
        throw new ConflictException('Username already exists');
      }
    }
    
    // 如果更新密码，进行加密
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }
    
    // 更新用户
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  // 删除用户
  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // 设置最后登录时间
  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { 
      lastLoginAt: new Date() 
    });
  }

  // 密码加密
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  // 验证密码
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}