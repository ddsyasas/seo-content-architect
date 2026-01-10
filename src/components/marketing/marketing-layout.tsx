'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MegaMenu, SolutionsMenu, ResourcesMenu } from './mega-menu';

interface MarketingLayoutProps {
    children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState<'solutions' | 'resources' | null>(null);
    const [mobileSubmenu, setMobileSubmenu] = useState<'solutions' | 'resources' | null>(null);

    const handleMenuToggle = (menu: 'solutions' | 'resources') => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const closeMenus = () => {
        setOpenMenu(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="py-6 px-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/SyncSEO Header logo 2-min.png"
                            alt="SyncSEO"
                            width={140}
                            height={40}
                            priority
                        />
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <MegaMenu
                            label="Solutions"
                            isOpen={openMenu === 'solutions'}
                            onToggle={() => handleMenuToggle('solutions')}
                            onClose={closeMenus}
                        >
                            <SolutionsMenu onClose={closeMenus} />
                        </MegaMenu>

                        <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Pricing
                        </Link>

                        <MegaMenu
                            label="Resources"
                            isOpen={openMenu === 'resources'}
                            onToggle={() => handleMenuToggle('resources')}
                            onClose={closeMenus}
                        >
                            <ResourcesMenu onClose={closeMenus} />
                        </MegaMenu>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Login
                        </Link>
                        <Link href="/signup">
                            <Button>Get Started Free</Button>
                        </Link>
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
                        <nav className="flex flex-col gap-1">
                            <div>
                                <button
                                    onClick={() => setMobileSubmenu(mobileSubmenu === 'solutions' ? null : 'solutions')}
                                    className="w-full flex items-center justify-between px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium"
                                >
                                    Solutions
                                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileSubmenu === 'solutions' ? 'rotate-180' : ''}`} />
                                </button>
                                {mobileSubmenu === 'solutions' && (
                                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">By Role</div>
                                        <Link href="/solutions/marketing-managers" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Marketing Managers</Link>
                                        <Link href="/solutions/seo-specialists" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>SEO Specialists</Link>
                                        <Link href="/solutions/content-managers" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Content Managers</Link>
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">By Team</div>
                                        <Link href="/solutions/agencies" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Agencies</Link>
                                        <Link href="/solutions/in-house-teams" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>In-house Teams</Link>
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">By Industry</div>
                                        <Link href="/solutions/ecommerce" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>eCommerce</Link>
                                        <Link href="/solutions/enterprise" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Enterprise</Link>
                                    </div>
                                )}
                            </div>

                            <Link href="/pricing" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                Pricing
                            </Link>

                            <div>
                                <button
                                    onClick={() => setMobileSubmenu(mobileSubmenu === 'resources' ? null : 'resources')}
                                    className="w-full flex items-center justify-between px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium"
                                >
                                    Resources
                                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileSubmenu === 'resources' ? 'rotate-180' : ''}`} />
                                </button>
                                {mobileSubmenu === 'resources' && (
                                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">Learn</div>
                                        <Link href="/resources/blog" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
                                        <Link href="/resources/webinars" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Webinars</Link>
                                        <Link href="/resources/youtube" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>YouTube</Link>
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">Explore</div>
                                        <Link href="/resources/knowledge-base" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Knowledge Base</Link>
                                        <Link href="/resources/product-updates" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Product Updates</Link>
                                        <Link href="/resources/why-syncseo" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Why SyncSEO</Link>
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">Free Resources</div>
                                        <Link href="/resources/content-architecture-template" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Content Architecture Template</Link>
                                        <Link href="/resources/internal-linking-checklist" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Internal Linking Checklist</Link>
                                        <Link href="/resources/seo-score-guide" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm" onClick={() => setIsMobileMenuOpen(false)}>SEO Score Guide</Link>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 mt-2 pt-2 flex flex-col gap-2">
                                <Link href="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                    Login
                                </Link>
                                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="px-4">
                                    <Button className="w-full">Get Started Free</Button>
                                </Link>
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Content */}
            {children}

            {/* Footer */}
            <footer className="py-16 px-4 border-t border-gray-200 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        <div className="col-span-2 md:col-span-1">
                            <Image src="/SyncSEO Header logo 2-min.png" alt="SyncSEO" width={120} height={35} />
                            <p className="mt-4 text-sm text-gray-500">Visual content architecture planning for SEO teams.</p>
                            <Link href="/contact" className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                Contact Us
                            </Link>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Solutions</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/solutions/marketing-managers" className="text-gray-500 hover:text-gray-900">Marketing Managers</Link></li>
                                <li><Link href="/solutions/seo-specialists" className="text-gray-500 hover:text-gray-900">SEO Specialists</Link></li>
                                <li><Link href="/solutions/content-managers" className="text-gray-500 hover:text-gray-900">Content Managers</Link></li>
                                <li><Link href="/solutions/agencies" className="text-gray-500 hover:text-gray-900">Agencies</Link></li>
                                <li><Link href="/solutions/enterprise" className="text-gray-500 hover:text-gray-900">Enterprise</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/resources/blog" className="text-gray-500 hover:text-gray-900">Blog</Link></li>
                                <li><Link href="/resources/webinars" className="text-gray-500 hover:text-gray-900">Webinars</Link></li>
                                <li><Link href="/resources/knowledge-base" className="text-gray-500 hover:text-gray-900">Knowledge Base</Link></li>
                                <li><Link href="/resources/product-updates" className="text-gray-500 hover:text-gray-900">Product Updates</Link></li>
                                <li><Link href="/resources/why-syncseo" className="text-gray-500 hover:text-gray-900">Why SyncSEO</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Free Resources</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/resources/content-architecture-template" className="text-gray-500 hover:text-gray-900">Content Architecture Template</Link></li>
                                <li><Link href="/resources/internal-linking-checklist" className="text-gray-500 hover:text-gray-900">Internal Linking Checklist</Link></li>
                                <li><Link href="/resources/seo-score-guide" className="text-gray-500 hover:text-gray-900">SEO Score Guide</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/pricing" className="text-gray-500 hover:text-gray-900">Pricing</Link></li>
                                <li><Link href="/login" className="text-gray-500 hover:text-gray-900">Login</Link></li>
                                <li><Link href="/signup" className="text-gray-500 hover:text-gray-900">Sign Up</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                                <Link href="/legal/privacy-policy" className="text-gray-500 hover:text-gray-900">Privacy Policy</Link>
                                <Link href="/legal/terms-of-service" className="text-gray-500 hover:text-gray-900">Terms of Service</Link>
                                <Link href="/legal/cookie-policy" className="text-gray-500 hover:text-gray-900">Cookie Policy</Link>
                                <Link href="/legal/refund-policy" className="text-gray-500 hover:text-gray-900">Refund Policy</Link>
                            </div>
                            <p className="text-sm text-gray-500">
                                © {new Date().getFullYear()} SyncSEO. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

interface SolutionPageProps {
    title: string;
    subtitle: string;
    description: string;
    features: { title: string; description: string }[];
}

export function SolutionPage({ title, subtitle, description, features }: SolutionPageProps) {
    return (
        <MarketingLayout>
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
                        {subtitle}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{title}</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">{description}</p>
                    <div className="mt-10 flex items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg">
                                Get Started Free
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/pricing">
                            <Button size="lg" variant="outline">View Pricing</Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-16 px-4 bg-white">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Key Features</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 bg-indigo-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
                    <p className="text-indigo-100 text-lg mb-8">Start for free. No credit card required.</p>
                    <Link href="/signup">
                        <Button size="lg" variant="secondary" className="text-indigo-600">
                            Get Started Free
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>
        </MarketingLayout>
    );
}

interface ResourcePageProps {
    title: string;
    subtitle: string;
    description: string;
    content?: React.ReactNode;
}

export function ResourcePage({ title, subtitle, description, content }: ResourcePageProps) {
    return (
        <MarketingLayout>
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
                        {subtitle}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{title}</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">{description}</p>
                </div>
            </section>

            {content && (
                <section className="py-16 px-4 bg-white">
                    <div className="max-w-4xl mx-auto">
                        {content}
                    </div>
                </section>
            )}

            <section className="py-20 px-4 bg-indigo-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your content strategy?</h2>
                    <p className="text-indigo-100 text-lg mb-8">Start for free. No credit card required.</p>
                    <Link href="/signup">
                        <Button size="lg" variant="secondary" className="text-indigo-600">
                            Get Started Free
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>
        </MarketingLayout>
    );
}
