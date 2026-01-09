import { generateResourceMetadata } from '@/lib/seo/generate-metadata';

export const metadata = generateResourceMetadata('youtube');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
