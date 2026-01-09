import { SolutionPage } from '@/components/marketing/marketing-layout';

export default function AgenciesPage() {
    return (
        <SolutionPage
            title="Multi-Client SEO Content Management"
            subtitle="For Agencies"
            description="Manage content strategies for multiple clients from one platform. Keep projects organized, collaborate with teams, and deliver results at scale."
            features={[
                { title: 'Multi-Project Management', description: 'Create separate projects for each client with dedicated workspaces.' },
                { title: 'Team Access Control', description: 'Invite team members and control access per project.' },
                { title: 'Client Presentations', description: 'Visual content maps perfect for client presentations.' },
                { title: 'White-Label Ready', description: 'Present professional content strategies to your clients.' },
                { title: 'Scalable Workflow', description: 'Manage dozens of clients without losing organization.' },
                { title: 'Progress Reporting', description: 'Track and report content progress to stakeholders.' },
            ]}
        />
    );
}
