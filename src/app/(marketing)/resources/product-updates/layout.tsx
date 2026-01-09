import { generateResourceMetadata } from '@/lib/seo/generate-metadata';

export const metadata = generateResourceMetadata('product-updates');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
