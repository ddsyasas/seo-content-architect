import { ResourcePage } from '@/components/marketing/marketing-layout';
import { Check, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const checklistItems = [
    'Identify your pillar pages and topic clusters',
    'Map out contextual link opportunities between related content',
    'Ensure every page has at least 3 internal links',
    'Use descriptive anchor text that includes target keywords',
    'Link from high-authority pages to important content',
    'Create a logical hierarchy from pillar to cluster to supporting',
    'Avoid orphan pages with no internal links',
    'Update old content with links to new articles',
    'Review and fix broken internal links regularly',
    'Balance link distribution across your site',
];

export default function InternalLinkingChecklistPage() {
    return (
        <ResourcePage
            title="Internal Linking Checklist"
            subtitle="Free Resource"
            description="A comprehensive checklist to optimize your internal linking strategy for better SEO."
            content={
                <div className="space-y-8">
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                        {checklistItems.map((item, index) => (
                            <div key={index} className="flex items-start gap-4 p-4">
                                <div className="w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-4 h-4 text-transparent" />
                                </div>
                                <span className="text-gray-700">{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-indigo-50 rounded-xl p-6 text-center">
                        <p className="text-indigo-900 mb-4">
                            Want to implement this checklist visually? Try SyncSEO free.
                        </p>
                        <Link href="/signup">
                            <Button>
                                <Download className="w-4 h-4 mr-2" />
                                Get Started Free
                            </Button>
                        </Link>
                    </div>
                </div>
            }
        />
    );
}
