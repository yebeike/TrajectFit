import { 
    Controller, Post, Body, UseGuards, Request, 
    Get, UseInterceptors, ClassSerializerInterceptor 
  } from '@nestjs/common';
  import { LocalAuthGuard } from './guards/local-auth.guard';
  import { JwtAuthGuard } from './guards/jwt-auth.guard';
  import { AuthService } from './auth.service';
  import { CreateUserDto } from '../users/dto/create-user.dto';
  
  @Controller('auth')
  @UseInterceptors(ClassSerializerInterceptor)
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
      return this.authService.register(createUserDto);
    }
  
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
      return this.authService.login(req.user);
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('refresh')
    async refreshToken(@Request() req) {
      return this.authService.refreshToken(req.user.id);
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
      return req.user;
    }
  }