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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../Auth/guards/roles.guard.js';
import { Roles } from '../Auth/decorators/roles.decorator.js';
import { UserRole } from '../generated/prisma/enums.js';
import { AdminService } from '../Service/adminService.service.js';
import { ListTransactionsQueryDTO } from '../DTO/request/adminDTO.js';
import { ListCampaignQueryDTO } from '../DTO/request/campaignDTO.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../DTO/request/categoryDTO.js';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard(): Promise<any> {
    return this.adminService.getDashboard();
  }

  @Get('campaigns')
  findCampaigns(@Query() query: ListCampaignQueryDTO): Promise<any> {
    return this.adminService.findCampaigns(query);
  }

  @Get('transactions')
  findTransactions(@Query() query: ListTransactionsQueryDTO): Promise<any> {
    return this.adminService.findTransactions(query);
  }

  @Get('categories')
  findCategories(): Promise<any> {
    return this.adminService.findCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDTO): Promise<any> {
    return this.adminService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDTO): Promise<any> {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string): Promise<any> {
    return this.adminService.removeCategory(id);
  }
}
