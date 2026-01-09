import { ResourcePage } from '@/components/marketing/marketing-layout';
import { Youtube, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function YoutubePage() {
    return (
        <ResourcePage
            title="YouTube Channel"
            subtitle="Learn"
            description="Video tutorials, tips, and strategies for content architecture and SEO planning."
            content={
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Youtube className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        We're working on video content to help you get the most out of SyncSEO.
                        Subscribe to be notified when we launch.
                    </p>
                    <a
                        href="https://youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Visit YouTube
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            }
        />
    );
}
