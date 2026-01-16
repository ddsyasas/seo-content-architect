import { type ReactNode } from 'react';
import { type Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Auth pages should not be indexed
export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
            {/* Header */}
            <header className="py-6 px-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="inline-flex items-center">
                        <Image
                            src="/SyncSEO Header logo 2-min.png"
                            alt="SyncSEO"
                            width={140}
                            height={40}
                            priority
                        />
                    </Link>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} SyncSEO. All rights reserved.
            </footer>
        </div>
    );
}
