'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, CreditCard, Receipt, Settings2, Users } from 'lucide-react';

interface SettingsNavProps {
    hasTeamAccess: boolean;
}

/**
 * Client Component: Settings navigation sidebar
 * Uses usePathname for active link highlighting
 */
export function SettingsNav({ hasTeamAccess }: SettingsNavProps) {
    const pathname = usePathname();

    const settingsLinks = [
        { href: '/settings/profile', label: 'Profile', icon: User },
        { href: '/settings/subscription', label: 'Subscription', icon: CreditCard },
        { href: '/settings/billing', label: 'Billing', icon: Receipt },
        { href: '/settings/preferences', label: 'Preferences', icon: Settings2 },
        ...(hasTeamAccess ? [{ href: '/settings/team', label: 'Team', icon: Users }] : []),
    ];

    return (
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
    );
}
