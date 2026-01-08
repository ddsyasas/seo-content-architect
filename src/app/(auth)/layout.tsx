import { type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
            {/* Header */}
            <header className="py-6 px-4">
                <div className="max-w-7xl mx-auto">
                    <Link href="/" className="inline-flex items-center">
                        <Image
                            src="/SyncSEO Header logo 2-min.png"
                            alt="SyncSEO"
                            width={140}
                            height={40}
                            priority
                        />
                    </Link>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 px-4 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} SyncSEO. All rights reserved.
            </footer>
        </div>
    );
}
