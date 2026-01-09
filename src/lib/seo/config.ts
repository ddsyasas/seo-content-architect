// SEO Configuration for SyncSEO
// This file contains all SEO-related constants and configurations

export const siteConfig = {
    name: 'SyncSEO',
    title: 'SyncSEO - Visual Content Architecture Planning for SEO',
    description: 'Plan your content architecture visually with SyncSEO. Design pillar pages, cluster content, and internal linking structures in an intuitive drag-and-drop canvas. Replace scattered spreadsheets with a visual workspace.',
    shortDescription: 'Visual content architecture planning tool for SEO teams',
    url: 'https://syncseo.io',
    ogImage: 'https://syncseo.io/SyncSEO.io Featured Image 01.webp',
    logo: 'https://syncseo.io/SyncSEO Header logo 2-min.png',
    favicon: '/favicon.ico',
    creator: 'SyncSEO',
    keywords: [
        'content architecture',
        'SEO planning',
        'content strategy',
        'pillar pages',
        'topic clusters',
        'internal linking',
        'content mapping',
        'SEO tool',
        'content planning',
        'visual content planning',
        'SEO content strategy',
        'content hierarchy',
        'link building strategy',
        'content organization',
        'SEO workflow',
    ],
    authors: [{ name: 'SyncSEO Team' }],
    category: 'Technology',
    locale: 'en_US',
    type: 'website',
    twitterHandle: '@syncseo',
    email: 'hi@syncseo.io',
};

// Page-specific metadata configurations
export const pageMetadata = {
    home: {
        title: 'SyncSEO - Visual Content Architecture Planning for SEO',
        description: 'Plan your content architecture visually with SyncSEO. Design pillar pages, cluster content, and internal linking structures in an intuitive drag-and-drop canvas.',
        keywords: ['content architecture tool', 'SEO planning software', 'visual content strategy', 'pillar page planning'],
    },
    pricing: {
        title: 'Pricing - SyncSEO | Affordable Content Planning for Teams',
        description: 'Simple, transparent pricing for SyncSEO. Start free, upgrade when you need more. No hidden fees, no per-user costs. Plans for individuals, teams, and agencies.',
        keywords: ['SEO tool pricing', 'content planning pricing', 'affordable SEO software'],
    },
    solutions: {
        'marketing-managers': {
            title: 'SyncSEO for Marketing Managers | Visual Content Strategy',
            description: 'Empower your marketing team with visual content architecture planning. Align content strategy with business goals, track progress, and collaborate effectively.',
            keywords: ['marketing content strategy', 'content planning for marketers', 'marketing team collaboration'],
        },
        'seo-specialists': {
            title: 'SyncSEO for SEO Specialists | Content Architecture Tool',
            description: 'Professional content architecture planning for SEO specialists. Map topic clusters, plan internal linking, and visualize content hierarchies.',
            keywords: ['SEO specialist tools', 'content architecture SEO', 'topic cluster planning'],
        },
        'content-managers': {
            title: 'SyncSEO for Content Managers | Content Organization Tool',
            description: 'Organize and plan your content strategy visually. Manage content calendars, track article status, and ensure consistent publishing.',
            keywords: ['content management tool', 'content organization', 'editorial planning'],
        },
        'agencies': {
            title: 'SyncSEO for Agencies | Client Content Planning at Scale',
            description: 'Manage multiple client content strategies in one place. Visual planning, team collaboration, and professional deliverables for SEO agencies.',
            keywords: ['SEO agency tools', 'client content management', 'agency content planning'],
        },
        'in-house-teams': {
            title: 'SyncSEO for In-House Teams | Collaborative Content Planning',
            description: 'Unite your in-house team around a visual content strategy. Real-time collaboration, shared workspaces, and clear content roadmaps.',
            keywords: ['in-house SEO team', 'team content collaboration', 'content roadmap planning'],
        },
        'ecommerce': {
            title: 'SyncSEO for eCommerce | Product Content Architecture',
            description: 'Plan product content architecture for eCommerce sites. Organize category pages, product descriptions, and buying guides visually.',
            keywords: ['ecommerce SEO', 'product content planning', 'ecommerce content strategy'],
        },
        'enterprise': {
            title: 'SyncSEO for Enterprise | Large-Scale Content Architecture',
            description: 'Enterprise-grade content architecture planning. Handle complex site structures, multiple teams, and large-scale content operations.',
            keywords: ['enterprise SEO', 'large scale content planning', 'enterprise content strategy'],
        },
    },
    resources: {
        'blog': {
            title: 'Blog - SyncSEO | SEO & Content Strategy Insights',
            description: 'Expert insights on content architecture, SEO strategy, and content planning. Learn best practices from the SyncSEO team.',
            keywords: ['SEO blog', 'content strategy insights', 'content architecture tips'],
        },
        'webinars': {
            title: 'Webinars - SyncSEO | Live Content Strategy Training',
            description: 'Join our live webinars on content architecture and SEO strategy. Learn from experts and get your questions answered.',
            keywords: ['SEO webinars', 'content strategy training', 'SEO learning'],
        },
        'youtube': {
            title: 'YouTube - SyncSEO | Video Tutorials & Tips',
            description: 'Watch video tutorials on content architecture planning, SEO strategy, and using SyncSEO effectively.',
            keywords: ['SEO tutorials', 'content planning videos', 'SyncSEO tutorials'],
        },
        'knowledge-base': {
            title: 'Knowledge Base - SyncSEO | Help & Documentation',
            description: 'Find answers to common questions about SyncSEO. Comprehensive documentation, guides, and how-to articles.',
            keywords: ['SyncSEO help', 'documentation', 'how to use SyncSEO'],
        },
        'product-updates': {
            title: 'Product Updates - SyncSEO | New Features & Improvements',
            description: 'Stay up to date with the latest SyncSEO features, improvements, and product updates.',
            keywords: ['SyncSEO updates', 'new features', 'product changelog'],
        },
        'why-syncseo': {
            title: 'Why SyncSEO? | Visual Content Planning Benefits',
            description: 'Discover why teams choose SyncSEO for content architecture planning. Visual-first approach, built for SEO, real-time collaboration.',
            keywords: ['why SyncSEO', 'content planning benefits', 'SyncSEO features'],
        },
        'content-architecture-template': {
            title: 'Free Content Architecture Template | SyncSEO',
            description: 'Download our free content architecture template. Plan pillar pages, topic clusters, and internal linking before building.',
            keywords: ['content architecture template', 'free SEO template', 'content planning template'],
        },
        'internal-linking-checklist': {
            title: 'Internal Linking Checklist | Free SEO Resource | SyncSEO',
            description: 'Comprehensive internal linking checklist for SEO. Optimize your site structure and improve link equity distribution.',
            keywords: ['internal linking checklist', 'SEO checklist', 'link building guide'],
        },
        'seo-score-guide': {
            title: 'SEO Score Guide | Understanding Content Optimization | SyncSEO',
            description: 'Learn how SyncSEO calculates SEO scores. Understand scoring factors and how to improve your content optimization.',
            keywords: ['SEO score', 'content optimization guide', 'SEO scoring factors'],
        },
    },
};

// Structured data templates
export const structuredData = {
    organization: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'SyncSEO',
        url: 'https://syncseo.io',
        logo: 'https://syncseo.io/SyncSEO Header logo 2-min.png',
        description: 'Visual content architecture planning tool for SEO teams',
        email: 'hi@syncseo.io',
        sameAs: [
            // Add social media URLs when available
        ],
    },
    website: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'SyncSEO',
        url: 'https://syncseo.io',
        description: 'Visual content architecture planning for SEO teams',
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://syncseo.io/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
        },
    },
    softwareApplication: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'SyncSEO',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free plan available',
        },
        description: 'Visual content architecture planning tool for SEO teams. Design pillar pages, cluster content, and internal linking structures.',
        featureList: [
            'Visual content canvas',
            'Drag-and-drop interface',
            'Internal linking visualization',
            'SEO scoring',
            'Team collaboration',
            'Content hierarchy planning',
        ],
    },
};
