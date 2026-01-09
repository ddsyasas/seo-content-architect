import { generateSolutionMetadata } from '@/lib/seo/generate-metadata';

export const metadata = generateSolutionMetadata('in-house-teams');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
