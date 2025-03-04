import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/services/users.service';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 验证用户
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return user;
  }

  // 用户登录
  async login(user: User) {
    // 更新最后登录时间
    await this.usersService.updateLastLogin(user.id);
    
    // 创建JWT Payload
    const payload = { 
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role 
    };
    
    return {
      user: new UserResponseDto(user),
      access_token: this.jwtService.sign(payload),
    };
  }

  // 用户注册
  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    
    // 创建JWT Payload
    const payload = { 
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role 
    };
    
    return {
      user: new UserResponseDto(user),
      access_token: this.jwtService.sign(payload),
    };
  }

  // 刷新令牌
  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);
    
    // 创建JWT Payload
    const payload = { 
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}