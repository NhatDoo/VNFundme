import { UserService } from '../Service/userService.service.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RegisterDTO } from '../DTO/request/registerDTO.js';
import { LoginDTO } from '../DTO/request/loginDTO.js';
import { ChangePasswordDTO } from '../DTO/request/changePasswordDTO.js';
import { ChangeProfileDTO } from '../DTO/request/changeProfileDTO.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListUsersQueryDTO, UpdateUserRoleDTO } from '../DTO/request/userDTO.js';
import { RefreshTokenDTO } from '../DTO/request/refreshTokenDTO.js';
import { AuthService } from '../Service/authService.service.js';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../Auth/guards/roles.guard.js';
import { CurrentUser } from '../Auth/decorators/current-user.decorator.js';
import { Roles } from '../Auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../Auth/auth.types.js';
import { UserRole } from '../generated/prisma/enums.js';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Body() userData: RegisterDTO): Promise<any> {
    return this.userService.register(userData);
  }

  @Post('login')
  login(
    @Body() loginData: LoginDTO,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginData;
    return this.userService.login(email, password);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDTO: RefreshTokenDTO): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refresh(refreshTokenDTO.refreshToken);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changePasswordData: ChangePasswordDTO,
  ): Promise<any> {
    const { oldPassword, newPassword } = changePasswordData;
    return this.userService.changepassword(user.id, oldPassword, newPassword);
  }

  @Patch('change-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  changeProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changeProfileData: ChangeProfileDTO,
  ): Promise<any> {
    return this.userService.changeProfile(user.id, changeProfileData.newProfileData);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  getProfile(@CurrentUser() user: AuthenticatedUser): Promise<any> {
    return this.userService.getProfile(user.id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  findAll(@Query() query: ListUsersQueryDTO): Promise<any> {
    return this.userService.findAll(query);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  findOne(@Param('id') id: string): Promise<any> {
    return this.userService.findOne(id);
  }

  @Patch('admin/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDTO: UpdateUserRoleDTO,
  ): Promise<any> {
    return this.userService.updateRole(id, updateUserRoleDTO.role);
  }

  @Patch('admin/:id/lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  lock(@Param('id') id: string): Promise<any> {
    return this.userService.lock(id);
  }

  @Patch('admin/:id/unlock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  unlock(@Param('id') id: string): Promise<any> {
    return this.userService.unlock(id);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  remove(@Param('id') id: string): Promise<any> {
    return this.userService.softDelete(id);
  }
}
