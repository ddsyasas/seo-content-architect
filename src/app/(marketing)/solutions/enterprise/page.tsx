import { SolutionPage } from '@/components/marketing/marketing-layout';

export default function EnterprisePage() {
    return (
        <SolutionPage
            title="Enterprise Content Architecture"
            subtitle="For Enterprise"
            description="Manage complex content operations at scale. Coordinate large teams, handle multiple brands, and maintain strategic consistency."
            features={[
                { title: 'Large-Scale Management', description: 'Handle hundreds of content pieces across multiple teams.' },
                { title: 'Role-Based Access', description: 'Control who can view and edit different projects.' },
                { title: 'Multi-Brand Support', description: 'Manage content strategies for different brands.' },
                { title: 'Governance & Control', description: 'Maintain content standards across the organization.' },
                { title: 'Integration Ready', description: 'Connect with your existing content tools.' },
                { title: 'Executive Reporting', description: 'Visual reports for stakeholder presentations.' },
            ]}
        />
    );
}
