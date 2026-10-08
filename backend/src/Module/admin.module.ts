import { Module } from '@nestjs/common';
import { AdminController } from '../controller/Admin.controller.js';
import { AdminService } from '../Service/adminService.service.js';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
