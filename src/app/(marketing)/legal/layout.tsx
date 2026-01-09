import type { Metadata } from 'next';

// Legal pages should not be indexed (low SEO value)
export const metadata: Metadata = {
    robots: {
        index: false,
        follow: true,
        googleBot: {
            index: false,
            follow: true,
        },
    },
};

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
