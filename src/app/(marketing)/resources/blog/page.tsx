import { ResourcePage } from '@/components/marketing/marketing-layout';
import Link from 'next/link';

const blogPosts = [
    { title: 'The Complete Guide to Content Architecture', category: 'Strategy', date: 'Coming Soon' },
    { title: 'How to Build Topic Clusters That Rank', category: 'SEO', date: 'Coming Soon' },
    { title: 'Internal Linking Best Practices for 2025', category: 'SEO', date: 'Coming Soon' },
    { title: 'Pillar Page Strategy: A Step-by-Step Guide', category: 'Strategy', date: 'Coming Soon' },
    { title: 'Content Planning for SEO Success', category: 'Planning', date: 'Coming Soon' },
    { title: 'Visual Content Mapping: Why It Works', category: 'Tools', date: 'Coming Soon' },
];

export default function BlogPage() {
    return (
        <ResourcePage
            title="Blog"
            subtitle="Learn"
            description="Expert insights on content architecture, SEO strategy, and building topical authority."
            content={
                <div className="grid md:grid-cols-2 gap-6">
                    {blogPosts.map((post, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-indigo-200 transition-colors">
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{post.category}</span>
                            <h3 className="text-lg font-semibold text-gray-900 mt-3 mb-2">{post.title}</h3>
                            <p className="text-sm text-gray-500">{post.date}</p>
                        </div>
                    ))}
                </div>
            }
        />
    );
}
