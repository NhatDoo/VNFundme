import { Module } from '@nestjs/common';
import { StorageService } from '../Service/storageService.service.js';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}