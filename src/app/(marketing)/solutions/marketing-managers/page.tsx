import { SolutionPage } from '@/components/marketing/marketing-layout';

export default function MarketingManagersPage() {
    return (
        <SolutionPage
            title="Content Planning for Marketing Managers"
            subtitle="For Marketing Managers"
            description="Plan and execute content strategies that drive results. Visualize your content roadmap, coordinate with your team, and track progress all in one place."
            features={[
                { title: 'Visual Content Calendar', description: 'See your entire content strategy at a glance with our visual canvas.' },
                { title: 'Team Coordination', description: 'Assign content to writers and track progress from planning to publish.' },
                { title: 'Strategy Alignment', description: 'Ensure all content aligns with your marketing goals and target keywords.' },
                { title: 'Content Hierarchy', description: 'Build pillar pages and topic clusters that establish authority.' },
                { title: 'Progress Tracking', description: 'Monitor content status from ideation to publication.' },
                { title: 'ROI Focused', description: 'Plan content that targets high-value keywords and topics.' },
            ]}
        />
    );
}
