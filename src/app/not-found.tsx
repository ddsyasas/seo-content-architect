'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Home, Search, ArrowLeft, MapPin, Compass } from 'lucide-react';

const seoJokes = [
    "Looks like this page has a 404 DA score...",
    "This page is ranking for: absolutely nothing.",
    "Even Google couldn't index this page.",
    "This URL has more broken links than a rusty chain.",
    "Our crawler got lost. Send help.",
    "This page's bounce rate is literally 100%.",
    "Keyword density: 0%. Content: Missing.",
    "This page failed its SEO audit... spectacularly.",
    "404: Content not found. Much like my motivation on Mondays.",
    "This link is deader than MySpace.",
];

const searchSuggestions = [
    "Maybe try 'pages that actually exist'?",
    "Popular searches: Home, Pricing, Contact",
    "Did you mean: literally any other page?",
    "Pro tip: Check your URL for typos",
];

export default function NotFound() {
    const [joke, setJoke] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setJoke(seoJokes[Math.floor(Math.random() * seoJokes.length)]);
        setSuggestion(searchSuggestions[Math.floor(Math.random() * searchSuggestions.length)]);
    }, []);

    const getNewJoke = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setJoke(seoJokes[Math.floor(Math.random() * seoJokes.length)]);
            setIsAnimating(false);
        }, 200);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
                {/* Animated 404 */}
                <div className="relative mb-8">
                    <h1 className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 leading-none select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            <Compass className="w-16 h-16 md:w-20 md:h-20 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
                            <MapPin className="w-6 h-6 md:w-8 md:h-8 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                        </div>
                    </div>
                </div>

                {/* Main Message */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Page Not Found
                </h2>

                {/* SEO Joke */}
                <div
                    className={`bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
                >
                    <p className="text-gray-600 italic">&ldquo;{joke}&rdquo;</p>
                    <button
                        onClick={getNewJoke}
                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                    >
                        Tell me another one
                    </button>
                </div>

                {/* Fake Search Bar */}
                <div className="relative max-w-md mx-auto mb-8">
                    <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-3 shadow-sm">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-400 text-sm">{suggestion}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
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
                <div className="border-t border-gray-200 pt-8">
                    <p className="text-sm text-gray-500 mb-4">Or try one of these popular pages:</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { href: '/pricing', label: 'Pricing' },
                            { href: '/resources/why-syncseo', label: 'Why SyncSEO' },
                            { href: '/solutions/seo-specialists', label: 'For SEO Specialists' },
                            { href: '/resources/blog', label: 'Blog' },
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

                {/* Easter Egg */}
                <p className="mt-12 text-xs text-gray-400">
                    Error Code: 404 | Page Status: Lost in the SERPs | Crawl Budget: Wasted
                </p>
            </div>
        </div>
    );
}
