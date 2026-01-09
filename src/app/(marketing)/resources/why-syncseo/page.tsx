import { ResourcePage } from '@/components/marketing/marketing-layout';
import { Check } from 'lucide-react';

const reasons = [
    { title: 'Visual-First Approach', description: 'Content architecture is inherently visual. Spreadsheets hide relationships. Our canvas reveals them.' },
    { title: 'Built for SEO Teams', description: 'Created by SEO professionals who understand the challenges of planning content at scale.' },
    { title: 'Real-Time Collaboration', description: 'Work together with your team, see changes instantly, and stay aligned on strategy.' },
    { title: 'Integrated SEO Scoring', description: 'Get instant feedback on your content with built-in SEO analysis as you write.' },
    { title: 'Simple Pricing', description: 'No hidden fees, no per-user costs that scale out of control. Fair pricing for teams of all sizes.' },
    { title: 'Fast & Focused', description: 'We do one thing well: visual content planning. No bloat, no distractions.' },
];

export default function WhySyncSEOPage() {
    return (
        <ResourcePage
            title="Why SyncSEO?"
            subtitle="Explore"
            description="Learn what makes SyncSEO the best choice for planning your content architecture."
            content={
                <div className="space-y-12">
                    <div className="prose prose-lg max-w-none">
                        <p className="text-xl text-gray-600 leading-relaxed">
                            Content architecture planning has been stuck in spreadsheets for too long.
                            SyncSEO brings your content strategy to life with a visual canvas that shows
                            how everything connects.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {reasons.map((reason, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                    <Check className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">{reason.title}</h3>
                                    <p className="text-gray-600">{reason.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }
        />
    );
}
