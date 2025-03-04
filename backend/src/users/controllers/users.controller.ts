import { 
    Controller, Get, Post, Body, Patch, Param, Delete, 
    UseGuards, Request, NotFoundException, ForbiddenException,
    UseInterceptors, ClassSerializerInterceptor,
    UploadedFile, BadRequestException 
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { UsersService } from '../services/users.service';
  import { CreateUserDto } from '../dto/create-user.dto';
  import { UpdateUserDto } from '../dto/update-user.dto';
  import { UserResponseDto } from '../dto/user-response.dto';
  import { UserRole } from '../entities/user.entity';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  import { ConfigService } from '@nestjs/config';
  
  @Controller('users')
  @UseInterceptors(ClassSerializerInterceptor)
  export class UsersController {
    // constructor(private readonly usersService: UsersService) {}
    constructor(
        private readonly usersService: UsersService,
        private readonly configService: ConfigService
      ) {}
    @Post()
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
      const user = await this.usersService.create(createUserDto);
      return new UserResponseDto(user);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAll(): Promise<UserResponseDto[]> {
      const users = await this.usersService.findAll();
      return users.map(user => new UserResponseDto(user));
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string, @Request() req): Promise<UserResponseDto> {
      // 只允许用户获取自己的信息，或管理员获取任何用户的信息
      if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You do not have permission to access this resource');
      }
      
      const user = await this.usersService.findById(id);
      return new UserResponseDto(user);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async update(
      @Param('id') id: string, 
      @Body() updateUserDto: UpdateUserDto,
      @Request() req
    ): Promise<UserResponseDto> {
      // 只允许用户更新自己的信息，或管理员更新任何用户的信息
      if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You do not have permission to update this resource');
      }
      
      const user = await this.usersService.update(id, updateUserDto);
      return new UserResponseDto(user);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string): Promise<{ message: string }> {
      await this.usersService.remove(id);
      return { message: 'User deleted successfully' };
    }
  
    @Get('profile/me')
    @UseGuards(JwtAuthGuard)
    async getMyProfile(@Request() req): Promise<UserResponseDto> {
      const user = await this.usersService.findById(req.user.id);
      return new UserResponseDto(user);
    }

    // 在现有的UsersController类中添加下面的方法
    @Post(':id/avatar')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
    FileInterceptor('avatar', {
        storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
            const userId = req.params.id;
            const fileExt = extname(file.originalname);
            const fileName = `${userId}-${Date.now()}${fileExt}`;
            cb(null, fileName);
        },
        }),
        fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new BadRequestException('只支持图像文件!'), false);
        }
        cb(null, true);
        },
        limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        },
    }),
    )
    async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    ) {
    // 权限检查
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You do not have permission to update this resource');
    }

    // 获取文件URL
    const baseUrl = this.configService.get('app.baseUrl') || 'http://localhost:3000';
    const avatarUrl = `${baseUrl}/api/uploads/avatars/${file.filename}`;
    
    // 更新用户头像URL
    await this.usersService.update(id, { avatarUrl });

    return { 
        avatarUrl 
    };
    }
    
  }


  

