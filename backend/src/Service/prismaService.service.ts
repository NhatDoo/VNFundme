import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import {OnModuleInit, OnModuleDestroy} from '@nestjs/common';

@Injectable()
export class prismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const adapter =  new PrismaPg({connectionString: process.env.DATABASE_URL});
        super({
            adapter: adapter
        });
    }

    async onModuleInit() {
        await this.$connect();
    } 
    async onModuleDestroy() {
        await this.$disconnect();
    }
}