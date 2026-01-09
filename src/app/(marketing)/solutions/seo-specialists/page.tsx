import { SolutionPage } from '@/components/marketing/marketing-layout';

export default function SEOSpecialistsPage() {
    return (
        <SolutionPage
            title="Build Topical Authority with Visual SEO Planning"
            subtitle="For SEO Specialists"
            description="Create comprehensive topic clusters, plan internal linking strategies, and build the content architecture that search engines love."
            features={[
                { title: 'Topic Cluster Mapping', description: 'Visualize pillar pages and supporting content in a clear hierarchy.' },
                { title: 'Internal Link Planning', description: 'Plan and track internal links to maximize link equity flow.' },
                { title: 'Keyword Mapping', description: 'Assign target keywords to each piece of content.' },
                { title: 'SEO Score Tracking', description: 'Get real-time SEO scores for your content as you write.' },
                { title: 'Content Gap Analysis', description: 'Identify missing content in your topic clusters.' },
                { title: 'Backlink Tracking', description: 'Track external links pointing to your content.' },
            ]}
        />
    );
}
