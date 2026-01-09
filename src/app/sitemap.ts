import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://syncseo.io';
    const currentDate = new Date().toISOString();

    // Marketing pages with high priority
    const marketingPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
    ];

    // Solution pages with high priority
    const solutionPages: MetadataRoute.Sitemap = [
        'marketing-managers',
        'seo-specialists',
        'content-managers',
        'agencies',
        'in-house-teams',
        'ecommerce',
        'enterprise',
    ].map((slug) => ({
        url: `${baseUrl}/solutions/${slug}`,
        lastModified: currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    // Resource pages with medium-high priority
    const resourcePages: MetadataRoute.Sitemap = [
        { slug: 'blog', priority: 0.8 },
        { slug: 'webinars', priority: 0.7 },
        { slug: 'youtube', priority: 0.7 },
        { slug: 'knowledge-base', priority: 0.7 },
        { slug: 'product-updates', priority: 0.6 },
        { slug: 'why-syncseo', priority: 0.8 },
        { slug: 'content-architecture-template', priority: 0.7 },
        { slug: 'internal-linking-checklist', priority: 0.7 },
        { slug: 'seo-score-guide', priority: 0.7 },
    ].map((page) => ({
        url: `${baseUrl}/resources/${page.slug}`,
        lastModified: currentDate,
        changeFrequency: 'monthly' as const,
        priority: page.priority,
    }));

    return [...marketingPages, ...solutionPages, ...resourcePages];
}
