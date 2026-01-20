import Link from 'next/link';
import { User, CreditCard, Receipt, Settings2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { SettingsNav } from './settings-nav';

/**
 * Server Component: Settings layout
 * Fetches subscription data to determine team access
 */
export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let hasTeamAccess = false;

    if (user) {
        const subscription = await prisma.subscriptions.findUnique({
            where: { user_id: user.id },
            select: { plan: true },
        });

        const plan = subscription?.plan || 'free';
        hasTeamAccess = plan === 'pro' || plan === 'agency';
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <SettingsNav hasTeamAccess={hasTeamAccess} />

                    {/* Content */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
