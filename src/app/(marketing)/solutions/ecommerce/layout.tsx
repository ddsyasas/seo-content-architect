import { generateSolutionMetadata } from '@/lib/seo/generate-metadata';

export const metadata = generateSolutionMetadata('ecommerce');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
