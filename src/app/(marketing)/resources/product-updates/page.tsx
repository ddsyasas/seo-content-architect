import { ResourcePage } from '@/components/marketing/marketing-layout';
import { Sparkles } from 'lucide-react';

const updates = [
    { version: '1.0', date: 'January 2025', title: 'Initial Launch', description: 'Visual content architecture planning with drag-and-drop canvas, SEO scoring, and team collaboration.' },
];

export default function ProductUpdatesPage() {
    return (
        <ResourcePage
            title="Product Updates"
            subtitle="Explore"
            description="Stay up to date with the latest features and improvements to SyncSEO."
            content={
                <div className="space-y-8">
                    {updates.map((update, index) => (
                        <div key={index} className="border-l-4 border-indigo-500 pl-6">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">v{update.version}</span>
                                <span className="text-sm text-gray-500">{update.date}</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{update.title}</h3>
                            <p className="text-gray-600">{update.description}</p>
                        </div>
                    ))}

                    <div className="bg-indigo-50 rounded-xl p-6 mt-8">
                        <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <span className="font-semibold text-indigo-900">Coming Soon</span>
                        </div>
                        <ul className="space-y-2 text-indigo-800">
                            <li>• Export to PNG and CSV</li>
                            <li>• Advanced analytics dashboard</li>
                            <li>• AI-powered content suggestions</li>
                            <li>• Integration with popular CMS platforms</li>
                        </ul>
                    </div>
                </div>
            }
        />
    );
}
