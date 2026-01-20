import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkTeamData() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('=== All Team Invitations ===');
        const invitations = await prisma.team_invitations.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                accepted_at: true,
                expires_at: true,
                project_id: true,
            },
        });
        console.log(invitations);

        console.log('\n=== All Team Members ===');
        const members = await prisma.team_members.findMany({
            select: {
                id: true,
                user_id: true,
                role: true,
                project_id: true,
                joined_at: true,
            },
        });
        console.log(members);

        console.log('\n=== All Subscriptions ===');
        const subscriptions = await prisma.subscriptions.findMany({
            select: {
                user_id: true,
                plan: true,
                status: true,
            },
        });
        console.log(subscriptions);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTeamData();
