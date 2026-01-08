import { type ReactNode } from 'react';
import { Network } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
            {/* Header */}
            <header className="py-6 px-4">
                <div className="max-w-7xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors">
                        <Network className="w-8 h-8" />
                        <span className="font-bold text-xl">SyncSEO</span>
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
