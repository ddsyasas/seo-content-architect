import { SolutionPage } from '@/components/marketing/marketing-layout';

export default function InHouseTeamsPage() {
    return (
        <SolutionPage
            title="Scale Your In-House Content Operation"
            subtitle="For In-House Teams"
            description="Bring your content team together with a visual workspace that keeps everyone aligned on strategy and execution."
            features={[
                { title: 'Centralized Planning', description: 'One source of truth for your entire content strategy.' },
                { title: 'Cross-Team Collaboration', description: 'Connect marketing, SEO, and content teams seamlessly.' },
                { title: 'Knowledge Sharing', description: 'Visualize content relationships for easier onboarding.' },
                { title: 'Workflow Management', description: 'Track content from ideation through publication.' },
                { title: 'Resource Planning', description: 'See workload distribution across your team.' },
                { title: 'Strategic Alignment', description: 'Ensure all content supports business objectives.' },
            ]}
        />
    );
}
