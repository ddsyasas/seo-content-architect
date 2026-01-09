import { ResourcePage } from '@/components/marketing/marketing-layout';
import { Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ContentArchitectureTemplatePage() {
    return (
        <ResourcePage
            title="Content Architecture Template"
            subtitle="Free Resource"
            description="A free template to help you plan your content architecture before building it in SyncSEO."
            content={
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 md:p-12 text-center">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Download the Template</h3>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                        This template includes sections for pillar pages, cluster content,
                        internal linking plans, and keyword mapping. Perfect for planning
                        before you build.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg">
                                <Download className="w-5 h-5 mr-2" />
                                Get Free Template
                            </Button>
                        </Link>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Sign up free to download</p>
                </div>
            }
        />
    );
}
