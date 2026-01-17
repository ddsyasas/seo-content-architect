import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const host = process.env.NEXT_PUBLIC_APP_URL || 'https://syncseo.io';
    const isProduction = host.includes('syncseo.io') && !host.includes('dev-preview');

    // Block all crawlers on non-production domains (dev-preview, vercel previews, localhost)
    if (!isProduction) {
        return {
            rules: {
                userAgent: '*',
                disallow: '/',
            },
        };
    }

    // Production robots.txt for syncseo.io
    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/pricing',
                    '/solutions/',
                    '/resources/',
                    '/*.webp$',
                    '/*.png$',
                    '/*.jpg$',
                    '/*.svg$',
                    '/*.ico$',
                ],
                disallow: [
                    '/dashboard',
                    '/projects',
                    '/project/',
                    '/settings',
                    '/settings/',
                    '/team',
                    '/invite/',
                    '/login',
                    '/signup',
                    '/forgot-password',
                    '/reset-password',
                    '/checkout/',
                    '/admin',
                    '/legal/',
                    '/api/',
                    '/share/',
                ],
            },
        ],
        sitemap: 'https://syncseo.io/sitemap.xml',
    };
}
