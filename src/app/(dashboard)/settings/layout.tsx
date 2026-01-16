'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, CreditCard, Receipt, Settings2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [hasTeamAccess, setHasTeamAccess] = useState(false);

    useEffect(() => {
        const checkSubscription = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: subscription } = await supabase
                    .from('subscriptions')
                    .select('plan')
                    .eq('user_id', user.id)
                    .single();

                const plan = subscription?.plan || 'free';
                setHasTeamAccess(plan === 'pro' || plan === 'agency');
            }
        };
        checkSubscription();
    }, []);

    const settingsLinks = [
        { href: '/settings/profile', label: 'Profile', icon: User },
        { href: '/settings/subscription', label: 'Subscription', icon: CreditCard },
        { href: '/settings/billing', label: 'Billing', icon: Receipt },
        { href: '/settings/preferences', label: 'Preferences', icon: Settings2 },
        ...(hasTeamAccess ? [{ href: '/settings/team', label: 'Team', icon: Users }] : []),
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <nav className="w-full md:w-64 shrink-0">
                        <ul className="space-y-1">
                            {settingsLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href;

                                return (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {link.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

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

