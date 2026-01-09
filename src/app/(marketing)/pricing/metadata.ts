import type { Metadata } from 'next';
import { siteConfig, pageMetadata } from '@/lib/seo/config';

export const metadata: Metadata = {
    title: pageMetadata.pricing.title,
    description: pageMetadata.pricing.description,
    keywords: pageMetadata.pricing.keywords,
    alternates: {
        canonical: `${siteConfig.url}/pricing`,
    },
    openGraph: {
        title: pageMetadata.pricing.title,
        description: pageMetadata.pricing.description,
        url: `${siteConfig.url}/pricing`,
        siteName: siteConfig.name,
        images: [
            {
                url: siteConfig.ogImage,
                width: 1200,
                height: 630,
                alt: 'SyncSEO Pricing - Affordable Content Planning',
            },
        ],
        locale: siteConfig.locale,
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: pageMetadata.pricing.title,
        description: pageMetadata.pricing.description,
        images: [siteConfig.ogImage],
    },
};
