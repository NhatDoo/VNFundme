import {UserController} from '../controller/User.controller.js';
import {UserService} from '../Service/userService.service.js';
import {Module} from '@nestjs/common';
import { AuthModule } from './auth.module.js';

@Module({
    imports: [AuthModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
