import { generateResourceMetadata } from '@/lib/seo/generate-metadata';

export const metadata = generateResourceMetadata('seo-score-guide');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
