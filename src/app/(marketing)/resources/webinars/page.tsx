import { ResourcePage } from '@/components/marketing/marketing-layout';

const webinars = [
    { title: 'Getting Started with SyncSEO', description: 'Learn the basics of visual content planning', status: 'Coming Soon' },
    { title: 'Building Your First Topic Cluster', description: 'Step-by-step walkthrough of cluster creation', status: 'Coming Soon' },
    { title: 'Advanced Internal Linking Strategies', description: 'Maximize your link equity with smart planning', status: 'Coming Soon' },
];

export default function WebinarsPage() {
    return (
        <ResourcePage
            title="Webinars"
            subtitle="Learn"
            description="Live and recorded sessions to help you master content architecture and SEO planning."
            content={
                <div className="space-y-6">
                    {webinars.map((webinar, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{webinar.title}</h3>
                                <p className="text-gray-600">{webinar.description}</p>
                            </div>
                            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full whitespace-nowrap">{webinar.status}</span>
                        </div>
                    ))}
                </div>
            }
        />
    );
}
