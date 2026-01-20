import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ProfilePageContent } from './profile-content';

export interface ProfileData {
    fullName: string;
    email: string;
}

/**
 * Server Component: Profile settings page
 * Fetches profile data server-side using Prisma
 */
export default async function ProfileSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch profile data using Prisma
    const profileData = await prisma.profiles.findUnique({
        where: { id: user.id },
        select: {
            full_name: true,
            email: true,
        },
    });

    const profile: ProfileData = {
        fullName: profileData?.full_name || '',
        email: profileData?.email || user.email || '',
    };

    return <ProfilePageContent initialProfile={profile} />;
}
