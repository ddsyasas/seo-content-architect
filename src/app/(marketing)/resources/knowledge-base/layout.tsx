import { generateResourceMetadata } from '@/lib/seo/generate-metadata';

export const metadata = generateResourceMetadata('knowledge-base');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
