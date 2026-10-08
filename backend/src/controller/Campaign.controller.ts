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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  CreateCampaignDTO,
  CreateCampaignUpdateDTO,
  ApproveCampaignDTO,
  ListCampaignQueryDTO,
  RejectCampaignDTO,
  UpdateCampaignDTO,
} from '../DTO/request/campaignDTO.js';
import { CampaignService } from '../Service/campaignService.service.js';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../Auth/guards/roles.guard.js';
import { CurrentUser } from '../Auth/decorators/current-user.decorator.js';
import { Roles } from '../Auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../Auth/auth.types.js';
import { UserRole } from '../generated/prisma/enums.js';

@ApiTags('Campaign')
@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createCampaignDTO: CreateCampaignDTO,
  ): Promise<any> {
    return this.campaignService.create(user, createCampaignDTO);
  }

  @Get()
  findAll(@Query() query: ListCampaignQueryDTO): Promise<any> {
    return this.campaignService.findPublicCampaigns(query);
  }

  @Get('organizer/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  getOrganizerDashboard(@CurrentUser() user: AuthenticatedUser): Promise<any> {
    return this.campaignService.getOrganizerDashboard(user);
  }

  @Get('organizer/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCampaignQueryDTO,
  ): Promise<any> {
    return this.campaignService.findMine(user, query);
  }

  @Get(':id/updates')
  findUpdates(@Param('id') id: string): Promise<any> {
    return this.campaignService.findPublicUpdates(id);
  }

  @Get(':id/donors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  findDonors(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.campaignService.findDonors(id, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.campaignService.findPublicCampaign(id);
  }

  @Get(':id/images')
  getCampaignImages(@Param('id') id: string): Promise<any> {
    return this.campaignService.getCampaignImages(id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 5))
  uploadImages(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    return this.campaignService.uploadImages(id, user, files);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.campaignService.removeImage(id, imageId, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateCampaignDTO: UpdateCampaignDTO,
  ): Promise<any> {
    return this.campaignService.update(id, user, updateCampaignDTO);
  }

  @Post(':id/updates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  createUpdate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() createCampaignUpdateDTO: CreateCampaignUpdateDTO,
  ): Promise<any> {
    return this.campaignService.createUpdate(id, user, createCampaignUpdateDTO);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveCampaignDTO,
  ): Promise<any> {
    return this.campaignService.approve(id, user, dto.reviewNote);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectCampaignDTO,
  ): Promise<any> {
    return this.campaignService.reject(id, user, dto.reviewNote);
  }

  @Patch(':id/resubmit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  resubmit(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.campaignService.resubmit(id, user);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  complete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.campaignService.complete(id, user);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.campaignService.cancel(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiBearerAuth('access-token')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.campaignService.remove(id, user);
  }
}