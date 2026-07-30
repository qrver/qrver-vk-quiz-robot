import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient {
    constructor() {
        super();
    }

    async connect(): Promise<void> {
        try {
            await this.$connect();
            console.log('Prisma connected');
        } catch (error) {
            console.error('Failed to connect to Prisma:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.$disconnect();
            console.log('Prisma disconnected');
        } catch (error) {
            console.error('Failed to disconnect from Prisma:', error);
            throw error;
        }
    }
}

export const prisma = new PrismaService();
