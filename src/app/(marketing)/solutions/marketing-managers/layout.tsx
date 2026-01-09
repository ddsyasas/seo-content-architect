import { generateSolutionMetadata } from '@/lib/seo/generate-metadata';

export const metadata = generateSolutionMetadata('marketing-managers');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
