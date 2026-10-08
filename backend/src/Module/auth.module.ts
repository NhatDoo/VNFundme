import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../Service/authService.service.js';
import { prismaService } from '../Service/prismaService.service.js';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../Auth/guards/roles.guard.js';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, prismaService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, prismaService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
