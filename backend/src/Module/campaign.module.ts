import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CampaignController } from '../controller/Campaign.controller.js';
import { CampaignService } from '../Service/campaignService.service.js';
import { AuthModule } from './auth.module.js';
import { StorageModule } from './storage.module.js';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 5, // max 5 images
      },
    }),
  ],
  controllers: [CampaignController],
  providers: [CampaignService],
})
export class CampaignModule {}