import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-xl w-full text-center">
                {/* 404 */}
                <h1 className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 leading-none select-none">
                    404
                </h1>

                {/* Message */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 -mt-4">
                    Page Not Found
                </h2>

                <p className="text-gray-500 mb-8">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Back to Home
                    </Link>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Contact Support
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-500 mb-3">Popular pages:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {[
                            { href: '/pricing', label: 'Pricing' },
                            { href: '/resources/why-syncseo', label: 'Why SyncSEO' },
                            { href: '/solutions/seo-specialists', label: 'For SEO Specialists' },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
