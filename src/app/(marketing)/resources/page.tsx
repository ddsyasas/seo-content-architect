'use client';

import Link from 'next/link';
import { Network, BookOpen, Video, FileText, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const resources = [
    {
        category: 'Getting Started',
        items: [
            { title: 'Quick Start Guide', description: 'Get up and running in 5 minutes', type: 'guide' },
            { title: 'Creating Your First Project', description: 'Step-by-step tutorial', type: 'tutorial' },
            { title: 'Understanding Content Architecture', description: 'Learn the fundamentals', type: 'article' },
        ],
    },
    {
        category: 'Content Strategy',
        items: [
            { title: 'Pillar Page Strategy', description: 'Build topic authority', type: 'guide' },
            { title: 'Content Cluster Model', description: 'Organize related content', type: 'article' },
            { title: 'Internal Linking Best Practices', description: 'Boost your SEO', type: 'guide' },
        ],
    },
    {
        category: 'SEO Optimization',
        items: [
            { title: 'Keyword Research Guide', description: 'Find the right keywords', type: 'guide' },
            { title: 'On-Page SEO Checklist', description: 'Optimize every page', type: 'checklist' },
            { title: 'SEO Score Explained', description: 'Understanding your metrics', type: 'article' },
        ],
    },
];

const typeIcons: Record<string, React.ReactNode> = {
    guide: <BookOpen className="w-4 h-4" />,
    tutorial: <Video className="w-4 h-4" />,
    article: <FileText className="w-4 h-4" />,
    checklist: <FileText className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
    guide: 'bg-blue-100 text-blue-700',
    tutorial: 'bg-purple-100 text-purple-700',
    article: 'bg-green-100 text-green-700',
    checklist: 'bg-orange-100 text-orange-700',
};

export default function ResourcesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="py-6 px-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-indigo-600">
                        <Network className="w-8 h-8" />
                        <span className="font-bold text-xl">SyncSEO</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Features
                        </Link>
                        <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Pricing
                        </Link>
                        <Link href="/resources" className="text-indigo-600 font-medium">
                            Resources
                        </Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Login
                        </Link>
                        <Link href="/signup">
                            <Button>Get Started Free</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Resources & Guides
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Learn how to make the most of SyncSEO with our comprehensive
                        guides, tutorials, and best practices.
                    </p>
                </div>
            </section>

            {/* Resources Grid */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="space-y-12">
                        {resources.map((section, sectionIndex) => (
                            <div key={sectionIndex}>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                    {section.category}
                                </h2>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {section.items.map((item, itemIndex) => (
                                        <div
                                            key={itemIndex}
                                            className="bg-white rounded-xl p-5 border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${typeColors[item.type]}`}>
                                                    {typeIcons[item.type]}
                                                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {item.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Help Section */}
            <section className="py-16 px-4 bg-gray-50 border-t border-gray-200">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Need more help?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Can't find what you're looking for? Our support team is here to help.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Contact Support
                        </Button>
                        <Link href="/signup">
                            <Button>
                                Get Started Free
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-gray-200">
                <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} SyncSEO. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
