import { SolutionPage } from '@/components/marketing/marketing-layout';

export default function EcommercePage() {
    return (
        <SolutionPage
            title="eCommerce Content Architecture"
            subtitle="For eCommerce"
            description="Plan product pages, category content, and supporting articles that drive organic traffic and conversions."
            features={[
                { title: 'Product Content Planning', description: 'Map out content for product pages and categories.' },
                { title: 'Buying Guide Strategy', description: 'Create content clusters around purchasing decisions.' },
                { title: 'Category Architecture', description: 'Build logical category structures for SEO.' },
                { title: 'Internal Linking', description: 'Connect products to relevant content and guides.' },
                { title: 'Seasonal Planning', description: 'Plan content around peak shopping seasons.' },
                { title: 'Conversion Focus', description: 'Structure content to guide users toward purchase.' },
            ]}
        />
    );
}
