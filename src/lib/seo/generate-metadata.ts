import type { Metadata } from 'next';
import { siteConfig, pageMetadata } from './config';

type SolutionSlug = keyof typeof pageMetadata.solutions;
type ResourceSlug = keyof typeof pageMetadata.resources;

export function generateSolutionMetadata(slug: SolutionSlug): Metadata {
    const page = pageMetadata.solutions[slug];
    const url = `${siteConfig.url}/solutions/${slug}`;

    return {
        title: page.title,
        description: page.description,
        keywords: page.keywords,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title: page.title,
            description: page.description,
            url,
            siteName: siteConfig.name,
            images: [
                {
                    url: siteConfig.ogImage,
                    width: 1200,
                    height: 630,
                    alt: page.title,
                },
            ],
            locale: siteConfig.locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: page.title,
            description: page.description,
            images: [siteConfig.ogImage],
        },
    };
}

export function generateResourceMetadata(slug: ResourceSlug): Metadata {
    const page = pageMetadata.resources[slug];
    const url = `${siteConfig.url}/resources/${slug}`;

    return {
        title: page.title,
        description: page.description,
        keywords: page.keywords,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title: page.title,
            description: page.description,
            url,
            siteName: siteConfig.name,
            images: [
                {
                    url: siteConfig.ogImage,
                    width: 1200,
                    height: 630,
                    alt: page.title,
                },
            ],
            locale: siteConfig.locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: page.title,
            description: page.description,
            images: [siteConfig.ogImage],
        },
    };
}

// Generate WebPage structured data for a page
export function generateWebPageStructuredData(
    title: string,
    description: string,
    url: string,
    breadcrumbs: { name: string; url: string }[]
) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url,
        breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url,
            })),
        },
    };
}
