import type { Metadata } from 'next';
import { siteConfig } from '@/lib/seo/config';

export const metadata: Metadata = {
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function SolutionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
