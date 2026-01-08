'use client';

import Link from 'next/link';
import {
    Network, Layers, GitBranch, Target, FileText, Zap,
    BarChart3, Users, Lock, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
    {
        icon: Layers,
        title: 'Visual Content Mapping',
        description: 'Drag-and-drop canvas to organize your content hierarchy. See pillar pages and clusters at a glance.',
        color: 'indigo',
    },
    {
        icon: GitBranch,
        title: 'Internal Link Planning',
        description: 'Plan and visualize internal linking strategies. Connect pages and track link relationships.',
        color: 'blue',
    },
    {
        icon: Target,
        title: 'SEO Score Tracking',
        description: 'Track target keywords, meta titles, descriptions, and get real-time SEO optimization scores.',
        color: 'green',
    },
    {
        icon: FileText,
        title: 'Rich Content Editor',
        description: 'Write and edit content directly in the app with a powerful rich text editor.',
        color: 'purple',
    },
    {
        icon: Zap,
        title: 'Real-time Collaboration',
        description: 'Work together with your team in real-time. See changes as they happen.',
        color: 'yellow',
    },
    {
        icon: BarChart3,
        title: 'Content Analytics',
        description: 'Track content performance, identify gaps, and optimize your strategy.',
        color: 'pink',
    },
    {
        icon: Users,
        title: 'Team Management',
        description: 'Invite team members, assign roles, and collaborate on projects together.',
        color: 'cyan',
    },
    {
        icon: Lock,
        title: 'Secure & Private',
        description: 'Your content is encrypted and secure. We never share your data with third parties.',
        color: 'gray',
    },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
    indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    green: { bg: 'bg-green-100', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
    pink: { bg: 'bg-pink-100', icon: 'text-pink-600' },
    cyan: { bg: 'bg-cyan-100', icon: 'text-cyan-600' },
    gray: { bg: 'bg-gray-100', icon: 'text-gray-600' },
};

export default function FeaturesPage() {
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
                        <Link href="/features" className="text-indigo-600 font-medium">
                            Features
                        </Link>
                        <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Pricing
                        </Link>
                        <Link href="/resources" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
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
                        Everything you need to plan<br />
                        <span className="text-indigo-600">winning content</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        From visual mapping to SEO optimization, we've got all the tools
                        you need to create content that ranks.
                    </p>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            const colors = colorClasses[feature.color];
                            return (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 bg-indigo-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to transform your content strategy?
                    </h2>
                    <p className="text-indigo-100 text-lg mb-8">
                        Start for free. No credit card required.
                    </p>
                    <Link href="/signup">
                        <Button size="lg" variant="secondary" className="text-indigo-600">
                            Get Started Free
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
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
