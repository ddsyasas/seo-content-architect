import { generateResourceMetadata } from '@/lib/seo/generate-metadata';

export const metadata = generateResourceMetadata('internal-linking-checklist');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
