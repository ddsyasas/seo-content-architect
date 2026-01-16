'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Layers, GitBranch, Target, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MegaMenu, SolutionsMenu, ResourcesMenu } from '@/components/marketing/mega-menu';

export default function HomePage() {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="py-6 px-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50 dark:border-gray-800 dark:bg-gray-900/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/SyncSEO Header logo 2-min.png"
              alt="SyncSEO"
              width={140}
              height={40}
              priority
            />
          </Link>

          {/* Center Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <MegaMenu
              label="Solutions"
              isOpen={openMenu === 'solutions'}
              onToggle={() => handleMenuToggle('solutions')}
              onClose={closeMenus}
            >
              <SolutionsMenu onClose={closeMenus} />
            </MegaMenu>

            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors dark:text-gray-300 dark:hover:text-white">
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

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors dark:text-gray-300 dark:hover:text-white">
              Login
            </Link>
            <Link href="/signup">
              <Button>Get Started Free</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4">
            <nav className="flex flex-col gap-1">
              {/* Solutions Accordion */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'solutions' ? null : 'solutions')}
                  className="w-full flex items-center justify-between px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                >
                  Solutions
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileSubmenu === 'solutions' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSubmenu === 'solutions' && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">By Role</div>
                    <Link href="/solutions/marketing-managers" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Marketing Managers</Link>
                    <Link href="/solutions/seo-specialists" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>SEO Specialists</Link>
                    <Link href="/solutions/content-managers" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Content Managers</Link>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">By Team</div>
                    <Link href="/solutions/agencies" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Agencies</Link>
                    <Link href="/solutions/in-house-teams" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>In-house Teams</Link>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">By Industry</div>
                    <Link href="/solutions/ecommerce" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>eCommerce</Link>
                    <Link href="/solutions/enterprise" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Enterprise</Link>
                  </div>
                )}
              </div>

              <Link
                href="/pricing"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>

              {/* Resources Accordion */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'resources' ? null : 'resources')}
                  className="w-full flex items-center justify-between px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                >
                  Resources
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileSubmenu === 'resources' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSubmenu === 'resources' && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">Learn</div>
                    <Link href="/resources/blog" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
                    <Link href="/resources/webinars" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Webinars</Link>
                    <Link href="/resources/youtube" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>YouTube</Link>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">Explore</div>
                    <Link href="/resources/knowledge-base" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Knowledge Base</Link>
                    <Link href="/resources/product-updates" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Product Updates</Link>
                    <Link href="/resources/why-syncseo" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Why SyncSEO</Link>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">Free Resources</div>
                    <Link href="/resources/content-architecture-template" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Content Architecture Template</Link>
                    <Link href="/resources/internal-linking-checklist" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Internal Linking Checklist</Link>
                    <Link href="/resources/seo-score-guide" className="block px-3 py-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm" onClick={() => setIsMobileMenuOpen(false)}>SEO Score Guide</Link>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
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

      {/* Hero */}
      <main className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6 dark:bg-indigo-900/50 dark:text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Visual Content Planning
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight dark:text-white">
            Map Your Content
            <span className="block text-indigo-600 dark:text-indigo-400">Architecture Visually</span>
          </h1>

          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
            Design pillar pages, cluster content, and internal linking structures in an intuitive
            drag-and-drop canvas. Replace scattered spreadsheets with a visual workspace.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8">
                Start Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 dark:bg-indigo-900/50">
              <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Hierarchy</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Visualize pillar pages and cluster articles. See your content structure at a glance.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 dark:bg-blue-900/50">
              <GitBranch className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Link Mapping</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Plan internal linking strategies. Connect pages and track link relationships.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 dark:bg-green-900/50">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SEO Focused</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track target keywords, content status, and publish dates for each piece.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-gray-200 mt-20 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Image
                src="/SyncSEO Header logo 2-min.png"
                alt="SyncSEO"
                width={120}
                height={35}
              />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Visual content architecture planning for SEO teams.
              </p>
              <Link href="/contact" className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium dark:text-indigo-400 dark:hover:text-indigo-300">
                Contact Us
              </Link>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 dark:text-white">Solutions</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/solutions/marketing-managers" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Marketing Managers</Link></li>
                <li><Link href="/solutions/seo-specialists" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">SEO Specialists</Link></li>
                <li><Link href="/solutions/content-managers" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Content Managers</Link></li>
                <li><Link href="/solutions/agencies" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Agencies</Link></li>
                <li><Link href="/solutions/enterprise" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Enterprise</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 dark:text-white">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/resources/blog" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Blog</Link></li>
                <li><Link href="/resources/webinars" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Webinars</Link></li>
                <li><Link href="/resources/knowledge-base" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Knowledge Base</Link></li>
                <li><Link href="/resources/product-updates" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Product Updates</Link></li>
                <li><Link href="/resources/why-syncseo" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Why SyncSEO</Link></li>
              </ul>
            </div>

            {/* Free Resources */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 dark:text-white">Free Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/resources/content-architecture-template" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Content Architecture Template</Link></li>
                <li><Link href="/resources/internal-linking-checklist" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Internal Linking Checklist</Link></li>
                <li><Link href="/resources/seo-score-guide" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">SEO Score Guide</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 dark:text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</Link></li>
                <li><Link href="/login" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Login</Link></li>
                <li><Link href="/signup" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                <Link href="/legal/privacy-policy" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Privacy Policy</Link>
                <Link href="/legal/terms-of-service" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Terms of Service</Link>
                <Link href="/legal/cookie-policy" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Cookie Policy</Link>
                <Link href="/legal/refund-policy" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Refund Policy</Link>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} SyncSEO. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
