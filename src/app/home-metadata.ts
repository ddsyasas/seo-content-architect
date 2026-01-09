import type { Metadata } from 'next';
import { siteConfig, pageMetadata, structuredData } from '@/lib/seo/config';

export const homeMetadata: Metadata = {
    title: pageMetadata.home.title,
    description: pageMetadata.home.description,
    keywords: [...siteConfig.keywords, ...pageMetadata.home.keywords],
    alternates: {
        canonical: siteConfig.url,
    },
    openGraph: {
        title: pageMetadata.home.title,
        description: pageMetadata.home.description,
        url: siteConfig.url,
        siteName: siteConfig.name,
        images: [
            {
                url: siteConfig.ogImage,
                width: 1200,
                height: 630,
                alt: 'SyncSEO - Visual Content Architecture Planning',
            },
        ],
        locale: siteConfig.locale,
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: pageMetadata.home.title,
        description: pageMetadata.home.description,
        images: [siteConfig.ogImage],
    },
};

// Home page specific structured data
export const homeStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'SyncSEO - Visual Content Architecture Planning',
    description: pageMetadata.home.description,
    url: siteConfig.url,
    mainEntity: structuredData.softwareApplication,
    breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: siteConfig.url,
            },
        ],
    },
};
