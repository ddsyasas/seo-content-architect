import { ResourcePage } from '@/components/marketing/marketing-layout';
import { BookOpen, Layers, Link2, FileText, Settings, Users } from 'lucide-react';

const categories = [
    { icon: BookOpen, title: 'Getting Started', description: 'Quick start guides and tutorials', articles: 5 },
    { icon: Layers, title: 'Content Architecture', description: 'Building pillar pages and clusters', articles: 8 },
    { icon: Link2, title: 'Internal Linking', description: 'Planning and managing links', articles: 6 },
    { icon: FileText, title: 'Article Editor', description: 'Writing and editing content', articles: 4 },
    { icon: Users, title: 'Team Collaboration', description: 'Working with your team', articles: 3 },
    { icon: Settings, title: 'Account & Billing', description: 'Managing your subscription', articles: 5 },
];

export default function KnowledgeBasePage() {
    return (
        <ResourcePage
            title="Knowledge Base"
            subtitle="Explore"
            description="Find answers, guides, and tutorials to help you get the most out of SyncSEO."
            content={
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-indigo-200 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                    <Icon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.title}</h3>
                                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                                <span className="text-xs text-gray-400">{category.articles} articles</span>
                            </div>
                        );
                    })}
                </div>
            }
        />
    );
}
