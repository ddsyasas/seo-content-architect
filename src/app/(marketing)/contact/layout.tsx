import type { Metadata } from 'next';
import { siteConfig } from '@/lib/seo/config';

export const metadata: Metadata = {
    title: 'Contact Us - SyncSEO | Get in Touch',
    description: 'Contact the SyncSEO team for questions, support, or partnership inquiries. Email us at hi@syncseo.io or fill out our contact form.',
    keywords: ['contact SyncSEO', 'SyncSEO support', 'SEO tool support', 'get in touch'],
    alternates: {
        canonical: `${siteConfig.url}/contact`,
    },
    openGraph: {
        title: 'Contact Us - SyncSEO | Get in Touch',
        description: 'Contact the SyncSEO team for questions, support, or partnership inquiries.',
        url: `${siteConfig.url}/contact`,
        siteName: siteConfig.name,
        images: [
            {
                url: siteConfig.ogImage,
                width: 1200,
                height: 630,
                alt: 'Contact SyncSEO',
            },
        ],
        locale: siteConfig.locale,
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Contact Us - SyncSEO',
        description: 'Contact the SyncSEO team for questions, support, or partnership inquiries.',
        images: [siteConfig.ogImage],
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
