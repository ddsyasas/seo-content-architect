'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import {
  ArrowRight,
  Layers,
  GitBranch,
  Target,
  Menu,
  X,
  ChevronDown,
  Play,
  Mail,
  FileSpreadsheet,
  EyeOff,
  Link2Off,
  Shuffle,
  MessageSquareX,
  LayoutDashboard,
  Gauge,
  Link2,
  Share2,
  UserPlus,
  PenTool,
  MousePointerClick,
  Network,
  Send,
  Rocket,
  Users,
  Briefcase,
  Building2,
  UserCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Settings,
  FolderKanban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MegaMenu, SolutionsMenu, ResourcesMenu } from '@/components/marketing/mega-menu';
import { PricingCards } from '@/components/pricing/PricingCard';
import { NewsletterPopup } from '@/components/marketing/NewsletterPopup';

// Structured Data for Home Page
const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'What is SyncSEO?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'SyncSEO is a visual SEO content architecture platform with an interactive writing dashboard. It helps content teams plan, write, and optimize SEO content while visualizing their entire content structure and internal linking in real-time.'
      }
    },
    {
      '@type': 'Question',
      'name': 'How is SyncSEO different from Notion or spreadsheets?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Unlike general-purpose tools, SyncSEO is purpose-built for SEO content. You get a visual canvas for content architecture, real-time SEO scoring while writing, and automatic link tracking that syncs to your canvas. Features no spreadsheet or Notion setup can match.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Is there a free plan?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Yes! The free plan includes 1 project, 10 articles, and 20 canvas nodes. It\'s fully functional for individuals getting started with visual content planning.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Can I share articles with clients?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Absolutely. On Pro and Agency plans, you can generate public URLs for any article. Clients can view the optimized, formatted content without needing to log in or create an account.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Does SyncSEO integrate with my CMS?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'SyncSEO is a standalone planning and writing tool. You can export content and publish to your CMS. Direct integrations with WordPress and other platforms are on our roadmap.'
      }
    },
    {
      '@type': 'Question',
      'name': 'How does the SEO scoring work?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'SyncSEO analyzes your content across 7 categories: keyword usage, meta elements, structure, readability, internal links, content length, and formatting. You get a score from 0-100 that updates in real-time as you write.'
      }
    }
  ]
};

const videoObjectSchema = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  'name': 'SyncSEO Demo - Visual Content Architecture & SEO Writing',
  'description': 'Watch how easy it is to plan your content architecture, connect topics, and optimize for SEO. All in one visual workspace.',
  'thumbnailUrl': 'https://syncseo.io/SyncSEO.io Featured Image 01.webp',
  'uploadDate': '2025-01-01',
  'duration': 'PT2M30S',
  'contentUrl': 'https://syncseo.io/videos/syncseo-demo.webm',
  'embedUrl': 'https://syncseo.io/#demo-video',
  'publisher': {
    '@type': 'Organization',
    'name': 'SyncSEO',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://syncseo.io/SyncSEO Header logo 2-min.png'
    }
  }
};

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'solutions' | 'resources' | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<'solutions' | 'resources' | null>(null);
  const [newsletterName, setNewsletterName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newsletterName) return;

    setIsSubscribing(true);
    setSubscribeMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: newsletterName }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubscribeMessage({ type: 'success', text: data.message || 'Thanks for subscribing! Check your inbox.' });
        setEmail('');
        setNewsletterName('');
        // Save to localStorage so popup doesn't show
        localStorage.setItem('newsletter_subscribed', 'true');
      } else {
        setSubscribeMessage({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch {
      setSubscribeMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleMenuToggle = (menu: 'solutions' | 'resources') => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenus = () => {
    setOpenMenu(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Structured Data - FAQ Page */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />
      {/* Structured Data - Video Object */}
      <Script
        id="video-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectSchema) }}
      />

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
            For SEO Teams, Agencies & Content Marketers
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight dark:text-white">
            Build Topical Authority
            <span className="block text-indigo-600 dark:text-indigo-400">You Can Actually See</span>
          </h1>

          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto dark:text-gray-400">
            Visualize your content architecture, plan internal links on a canvas, and write with real-time SEO guidance. All in one workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8">
                Start Free, No Credit Card
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#demo-video">
              <Button size="lg" variant="outline" className="text-base px-8">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </a>
          </div>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Join 1,000+ SEO professionals who&apos;ve escaped spreadsheet chaos
          </p>
        </div>

        {/* Demo Video Section */}
        <div id="demo-video" className="max-w-5xl mx-auto mt-24 scroll-mt-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4 dark:bg-purple-900/50 dark:text-purple-300">
              <Play className="w-3 h-3" />
              Sneak Peek
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              See It in Action
            </h2>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              Watch how easy it is to plan your content architecture, connect topics, and optimize for SEO. All in one visual workspace.
            </p>
          </div>

          {/* Video Container with Browser Frame */}
          <div className="relative">
            {/* Browser Frame */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-t-xl px-4 py-3 border border-b-0 border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 ml-4">
                  <div className="bg-white dark:bg-gray-700 rounded-md px-3 py-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto text-center">
                    app.syncseo.io
                  </div>
                </div>
              </div>
            </div>

            {/* Video */}
            <div className="relative bg-gray-900 rounded-b-xl overflow-hidden border border-t-0 border-gray-200 dark:border-gray-700 shadow-2xl">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              >
                <source src="/videos/demo.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Decorative gradient blur */}
            <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50 dark:opacity-30"></div>
          </div>
        </div>

        {/* Pain Points Section */}
        <div className="max-w-6xl mx-auto mt-32 px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4 dark:bg-red-900/50 dark:text-red-300">
              Sound Familiar?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              The Content Chaos Problem
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              Managing SEO content at scale is broken. As your content library grows, so does the chaos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pain 1: Spreadsheet Hell */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4 dark:bg-red-900/30">
                <FileSpreadsheet className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spreadsheet Hell</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                100+ row spreadsheets become unnavigable. Version conflicts. No one can visualize how articles relate to each other.
              </p>
            </div>

            {/* Pain 2: Blind Writing */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 dark:bg-orange-900/30">
                <EyeOff className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Blind Writing</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Writers create content without real-time feedback. Issues discovered post-writing require painful rewrites.
              </p>
            </div>

            {/* Pain 3: Invisible Link Structure */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-4 dark:bg-yellow-900/30">
                <Link2Off className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invisible Link Structure</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Links are buried inside content. No way to visualize the link graph. Orphan pages go unnoticed.
              </p>
            </div>

            {/* Pain 4: Disconnected Workflows */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 dark:bg-purple-900/30">
                <Shuffle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Disconnected Workflows</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Strategy in spreadsheets, content in CMS. No connection between the plan and reality. Strategy becomes outdated.
              </p>
            </div>

            {/* Pain 5: Client Communication Gaps */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-4 dark:bg-pink-900/30">
                <MessageSquareX className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client Communication Gaps</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Sending Word docs lacks professionalism. Clients can&apos;t see SEO efforts. Approval workflows involve messy email chains.
              </p>
            </div>

            {/* Cost Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 dark:bg-amber-900/30">
                <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">The Real Cost</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Hours wasted, costly rewrites, weak topical authority, lost clients, and missed rankings. There&apos;s a better way.
              </p>
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div className="max-w-6xl mx-auto mt-32 px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4 dark:bg-green-900/50 dark:text-green-300">
              The Solution
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Where SEO Strategy Meets Content Creation
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              SyncSEO unifies content planning and content creation in one visual workspace. Everything syncs in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Solution 1: Visual Canvas */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 shadow-sm border border-indigo-100 dark:from-indigo-950/50 dark:to-gray-800 dark:border-indigo-900/50">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-5 dark:bg-indigo-900/50">
                <LayoutDashboard className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Visual Content Canvas</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                A drag-and-drop canvas where you map your entire content architecture. Pillar pages at the center, clusters connected, supporting articles linked. See your strategy at a glance.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Drag-and-drop node placement
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Zoom and pan navigation
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Visual link connections with anchor text
                </li>
              </ul>
            </div>

            {/* Solution 2: Real-Time SEO Scoring */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 shadow-sm border border-green-100 dark:from-green-950/50 dark:to-gray-800 dark:border-green-900/50">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-5 dark:bg-green-900/50">
                <Gauge className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Real-Time SEO Scoring</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Writers get SEO feedback while writing, not after. Watch your score update in real-time as you type. Know exactly what to improve before publishing.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  7 scoring categories (0-100)
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Issue highlighting with fix suggestions
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Traffic light indicators (red/yellow/green)
                </li>
              </ul>
            </div>

            {/* Solution 3: Automatic Link Tracking */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-sm border border-blue-100 dark:from-blue-950/50 dark:to-gray-800 dark:border-blue-900/50">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-5 dark:bg-blue-900/50">
                <Link2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Automatic Link Tracking</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Add a link in the editor, it appears on the canvas. Every internal link syncs automatically with anchor text displayed. Never lose track of your link structure.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Auto-detection of internal links
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Anchor text strategy visible
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Identify orphan pages instantly
                </li>
              </ul>
            </div>

            {/* Solution 4: Public Sharing */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 shadow-sm border border-purple-100 dark:from-purple-950/50 dark:to-gray-800 dark:border-purple-900/50">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-5 dark:bg-purple-900/50">
                <Share2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Public Article Sharing</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Generate shareable public URLs for any article. Clients view optimized content without logging in. Professional presentation, faster approvals.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  One-click public link generation
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  No login required for viewers
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Revoke access anytime
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto mt-32 px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4 dark:bg-blue-900/50 dark:text-blue-300">
              Simple Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              From sign-up to published content in 6 simple steps. No complex setup required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 dark:bg-indigo-900/50">
                <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sign Up Free</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Create your free account in seconds. No credit card required to get started.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 dark:bg-blue-900/50">
                <FolderKanban className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Project</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Name your project (website or client name) and enter your visual workspace.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 dark:bg-purple-900/50">
                <MousePointerClick className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plan on Canvas</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Add pillar pages, clusters, and supporting content. Arrange your content structure visually.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 dark:bg-green-900/50">
                <PenTool className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Write with SEO Feedback</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Open any article and write. Watch your SEO score update in real-time as you type.
              </p>
            </div>

            {/* Step 5 */}
            <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                5
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 dark:bg-orange-900/50">
                <Network className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Build Link Network</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Add internal links and watch them appear on your canvas automatically with anchor text.
              </p>
            </div>

            {/* Step 6 */}
            <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                6
              </div>
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-4 dark:bg-pink-900/50">
                <Send className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share & Publish</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Share articles with clients for approval, then export or publish to your CMS.
              </p>
            </div>
          </div>
        </div>

        {/* Who Is This For Section */}
        <div className="max-w-6xl mx-auto mt-32 px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4 dark:bg-purple-900/50 dark:text-purple-300">
              Built For You
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Who Is SyncSEO For?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              Whether you&apos;re a solo freelancer or managing an agency, SyncSEO adapts to your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Persona 1: SEO Specialists */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 dark:bg-indigo-900/50">
                <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SEO Specialists</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Stop drowning in spreadsheets. See your content structure and link strategy on a visual canvas.
              </p>
              <p className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                &ldquo;Finally, I can see my entire content strategy at once.&rdquo;
              </p>
            </div>

            {/* Persona 2: Content Writers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 dark:bg-green-900/50">
                <PenTool className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Writers</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Get real-time SEO guidance as you write. No more painful rewrites after SEO audits.
              </p>
              <p className="mt-3 text-sm font-medium text-green-600 dark:text-green-400">
                &ldquo;I optimize while writing, not after.&rdquo;
              </p>
            </div>

            {/* Persona 3: Content Managers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 dark:bg-blue-900/50">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Managers</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Ensure quality at scale with consistent SEO scoring. Every writer meets the same standard.
              </p>
              <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                &ldquo;Quality is consistent across all my writers.&rdquo;
              </p>
            </div>

            {/* Persona 4: Agency Owners */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 dark:bg-purple-900/50">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agency Owners</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage multiple clients efficiently. Separate projects, teams, and visual strategies for each.
              </p>
              <p className="mt-3 text-sm font-medium text-purple-600 dark:text-purple-400">
                &ldquo;Client work is finally organized.&rdquo;
              </p>
            </div>

            {/* Persona 5: Freelancers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 dark:bg-orange-900/50">
                <Briefcase className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Freelancers</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Deliver professional, SEO-optimized content. Share polished articles with clients for approval.
              </p>
              <p className="mt-3 text-sm font-medium text-orange-600 dark:text-orange-400">
                &ldquo;My deliverables look professional.&rdquo;
              </p>
            </div>

            {/* Persona 6: Marketing Teams */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-4 dark:bg-pink-900/50">
                <Rocket className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Marketing Teams</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Align content strategy with business goals. Visual planning makes strategy tangible for everyone.
              </p>
              <p className="mt-3 text-sm font-medium text-pink-600 dark:text-pink-400">
                &ldquo;Everyone understands our content strategy.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid - Expanded */}
        <div className="max-w-6xl mx-auto mt-32 px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4 dark:bg-indigo-900/50 dark:text-indigo-300">
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Everything You Need to Build Topical Authority
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              A complete toolkit for planning, writing, and optimizing SEO content.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 dark:bg-indigo-900/50">
                <LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visual Content Canvas</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Drag-and-drop canvas with zoom, pan, and auto-layout. See your entire content architecture visually.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 dark:bg-green-900/50">
                <PenTool className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interactive Writing Dashboard</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Rich text editor with auto-save. Write in a clean, distraction-free environment built for SEO.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 dark:bg-blue-900/50">
                <Gauge className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Real-Time SEO Scoring</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                7 scoring categories with instant feedback. Keyword usage, meta elements, readability, and more.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 dark:bg-purple-900/50">
                <GitBranch className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Automatic Link Tracking</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Every internal link syncs to canvas with anchor text. Direction indicators show link flow.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 dark:bg-orange-900/50">
                <Layers className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Hierarchy System</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Organize as Pillar, Cluster, or Supporting. Build topic clusters that search engines recognize.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-4 dark:bg-pink-900/50">
                <UserCheck className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Collaboration</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Role-based permissions (Owner, Admin, Editor, Viewer). Work together in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="max-w-5xl mx-auto mt-32 px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium mb-4 dark:bg-yellow-900/50 dark:text-yellow-300">
              Why Switch
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Traditional Tools vs SyncSEO
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              See why teams are switching from spreadsheets and disconnected tools to SyncSEO.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-900">
              <div className="p-4 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">Aspect</div>
              <div className="p-4 font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 text-center">Traditional</div>
              <div className="p-4 font-semibold text-indigo-600 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-700 text-center">SyncSEO</div>
            </div>

            {[
              { aspect: 'Content Strategy', traditional: 'Spreadsheets', syncseo: 'Visual Canvas' },
              { aspect: 'Writing Environment', traditional: 'Separate tool (Docs, CMS)', syncseo: 'Integrated Dashboard' },
              { aspect: 'Link Tracking', traditional: 'Manual updates', syncseo: 'Automatic sync' },
              { aspect: 'SEO Feedback', traditional: 'After writing (audit)', syncseo: 'Real-time scoring' },
              { aspect: 'Client Sharing', traditional: 'Email attachments', syncseo: 'Public sharing links' },
              { aspect: 'Content Structure', traditional: 'Hidden in folders', syncseo: 'Visible at a glance' },
            ].map((row, index) => (
              <div key={index} className="grid grid-cols-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div className="p-4 text-gray-900 dark:text-white font-medium">{row.aspect}</div>
                <div className="p-4 text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  {row.traditional}
                </div>
                <div className="p-4 text-gray-900 dark:text-white text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {row.syncseo}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="max-w-6xl mx-auto mt-32 px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium mb-4 dark:bg-cyan-900/50 dark:text-cyan-300">
              Use Cases
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              How Teams Use SyncSEO
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              Real scenarios where SyncSEO transforms content workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Use Case 1 */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 border border-indigo-100 dark:from-indigo-950/50 dark:to-gray-800 dark:border-indigo-900/50">
              <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">SaaS Companies</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Building a Content Hub</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Map pillar pages and clusters to establish thought leadership. Visualize your complete content hub structure before writing a single word.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Plan entire hub visually
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Track completion on canvas
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Build interlinked authority
                </li>
              </ul>
            </div>

            {/* Use Case 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-100 dark:from-purple-950/50 dark:to-gray-800 dark:border-purple-900/50">
              <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">SEO Agencies</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Multi-Client Management</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Separate projects for each client with dedicated canvases and team access. Share progress visually with stakeholders.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Organized client separation
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Professional client sharing
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Scale content production
                </li>
              </ul>
            </div>

            {/* Use Case 3 */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-100 dark:from-green-950/50 dark:to-gray-800 dark:border-green-900/50">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">Content Teams</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Topic Cluster Strategy</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Implement pillar-cluster SEO strategy with visual mapping. See every connection, identify gaps, and build topical authority.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Visual cluster mapping
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Identify content gaps
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Consistent SEO quality
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-32 px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-4 dark:bg-gray-800 dark:text-gray-300">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What is SyncSEO?',
                a: 'SyncSEO is a visual SEO content architecture platform with an interactive writing dashboard. It helps content teams plan, write, and optimize SEO content while visualizing their entire content structure and internal linking in real-time.'
              },
              {
                q: 'How is SyncSEO different from Notion or spreadsheets?',
                a: 'Unlike general-purpose tools, SyncSEO is purpose-built for SEO content. You get a visual canvas for content architecture, real-time SEO scoring while writing, and automatic link tracking that syncs to your canvas. Features no spreadsheet or Notion setup can match.'
              },
              {
                q: 'Is there a free plan?',
                a: 'Yes! The free plan includes 1 project, 10 articles, and 20 canvas nodes. It\'s fully functional for individuals getting started with visual content planning.'
              },
              {
                q: 'Can I share articles with clients?',
                a: 'Absolutely. On Pro and Agency plans, you can generate public URLs for any article. Clients can view the optimized, formatted content without needing to log in or create an account.'
              },
              {
                q: 'Does SyncSEO integrate with my CMS?',
                a: 'SyncSEO is a standalone planning and writing tool. You can export content and publish to your CMS. Direct integrations with WordPress and other platforms are on our roadmap.'
              },
              {
                q: 'How does the SEO scoring work?',
                a: 'SyncSEO analyzes your content across 7 categories: keyword usage, meta elements, structure, readability, internal links, content length, and formatting. You get a score from 0-100 that updates in real-time as you write.'
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{faq.q}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="max-w-4xl mx-auto mt-32 px-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 md:p-16 text-center dark:from-indigo-800 dark:to-purple-900">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to See Your Content Architecture?
            </h2>
            <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
              Join thousands of SEO professionals who&apos;ve escaped spreadsheet chaos. Build topical authority you can actually see.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 text-base px-8 font-semibold dark:bg-white dark:text-indigo-700 dark:hover:bg-gray-100">
                  Start Free, No Credit Card
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-indigo-200">
              Free forever plan available. Upgrade when you&apos;re ready.
            </p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="max-w-5xl mx-auto mt-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Simple, honest pricing
            </h2>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
              Start free, upgrade when you need more. No hidden fees, no surprises.
            </p>
            <p className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Trusted by SEO Experts
            </p>
          </div>

          {/* Pricing Cards */}
          <PricingCards href="/pricing" />

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            All plans include a 14-day money-back guarantee. No questions asked.
          </p>
        </div>
      </main>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl mb-6">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Stay Ahead of the SEO Curve
          </h2>
          <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
            Get weekly insights on content architecture, internal linking strategies, and SEO best practices delivered straight to your inbox.
          </p>

          <form onSubmit={handleSubscribe} className="mt-8 flex flex-col gap-3 max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newsletterName}
                onChange={(e) => setNewsletterName(e.target.value)}
                placeholder="Your name"
                className="flex-1 px-5 py-4 rounded-xl border-2 border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-indigo-200 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all"
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 px-5 py-4 rounded-xl border-2 border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-indigo-200 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubscribing}
              className="w-full sm:w-auto sm:mx-auto px-8 py-4 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl transition-all dark:bg-white dark:text-indigo-700 dark:hover:bg-gray-100"
            >
              {isSubscribing ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>

          {subscribeMessage && (
            <p className={`mt-4 text-sm ${subscribeMessage.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
              {subscribeMessage.text}
            </p>
          )}

          <p className="mt-4 text-sm text-indigo-200">
            Join 1,000+ SEO professionals. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
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

      {/* Newsletter Popup for new visitors */}
      <NewsletterPopup />
    </div>
  );
}
