import { SolutionPage } from '@/components/marketing/marketing-layout';

export default function ContentManagersPage() {
    return (
        <SolutionPage
            title="Organize Your Content Team Efficiently"
            subtitle="For Content Managers"
            description="Streamline your content workflow, manage writers, and ensure every piece of content fits into your larger strategy."
            features={[
                { title: 'Content Assignment', description: 'Assign articles to writers and track their progress.' },
                { title: 'Status Tracking', description: 'See which content is planned, in progress, or published.' },
                { title: 'Writer Collaboration', description: 'Share projects with your team and collaborate in real-time.' },
                { title: 'Content Repository', description: 'Keep all your content organized in one visual workspace.' },
                { title: 'Editorial Calendar', description: 'Plan publish dates and manage your content schedule.' },
                { title: 'Quality Control', description: 'Review SEO scores before content goes live.' },
            ]}
        />
    );
}
