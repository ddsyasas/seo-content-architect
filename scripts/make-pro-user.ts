import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function makeProUser(email: string) {
    console.log('Connecting to database...');
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found in environment');
        return;
    }
    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter });

    try {
        // Find user by email in profiles
        const profile = await prisma.profiles.findFirst({
            where: { email: email.toLowerCase() },
        });

        if (!profile) {
            console.log(`User with email ${email} not found in profiles table`);

            // Check team_invitations
            const invitation = await prisma.team_invitations.findFirst({
                where: { email: email.toLowerCase() },
            });

            if (invitation) {
                console.log('\nFound in team_invitations:');
                console.log('  Invitation ID:', invitation.id);
                console.log('  Accepted at:', invitation.accepted_at);
                console.log('  Role:', invitation.role);
            }

            // Let's check all profiles
            const allProfiles = await prisma.profiles.findMany({
                select: { id: true, email: true, full_name: true },
            });
            console.log('\nExisting profiles:', allProfiles);

            console.log('\n⚠️  The user needs to sign up first before they can be made a Pro user.');
            console.log('   Or you can provide one of the existing email addresses.');
            return;
        }

        console.log(`Found user: ${profile.full_name || profile.email} (${profile.id})`);

        // Upsert subscription to Pro
        const subscription = await prisma.subscriptions.upsert({
            where: { user_id: profile.id },
            update: {
                plan: 'pro',
                status: 'active',
                updated_at: new Date(),
            },
            create: {
                user_id: profile.id,
                plan: 'pro',
                status: 'active',
            },
        });

        console.log(`✅ Successfully made ${email} a Pro user!`);
        console.log('Subscription:', subscription);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run with the email from command line or default
const email = process.argv[2] || 'thilinanuwanstripe@gmail.com';
makeProUser(email);
