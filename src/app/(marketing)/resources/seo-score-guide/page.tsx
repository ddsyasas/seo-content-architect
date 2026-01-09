import { ResourcePage } from '@/components/marketing/marketing-layout';

const scoreFactors = [
    { name: 'Target Keyword', weight: '25%', description: 'Keyword density, placement in first paragraph, and avoiding stuffing.' },
    { name: 'Meta Elements', weight: '20%', description: 'Title length (50-60 chars), keyword in title, meta description optimization.' },
    { name: 'Content Structure', weight: '20%', description: 'Single H1, keyword in headings, proper hierarchy, H2 frequency.' },
    { name: 'Readability', weight: '10%', description: 'Paragraph length, sentence structure, and overall readability.' },
    { name: 'Internal Links', weight: '10%', description: 'Target of 3 links per 1000 words to related content.' },
    { name: 'Images', weight: '10%', description: '1 image per 400 words with proper alt text.' },
    { name: 'Outbound Links', weight: '5%', description: 'Optimal 1-5 external links to authoritative sources.' },
];

const scoreRanges = [
    { range: '81-100', label: 'Excellent', color: 'bg-green-500', description: 'Your content is well-optimized for search engines.' },
    { range: '61-80', label: 'Good', color: 'bg-lime-500', description: 'Minor improvements could boost your rankings.' },
    { range: '41-60', label: 'Needs Work', color: 'bg-orange-500', description: 'Several areas need attention before publishing.' },
    { range: '0-40', label: 'Poor', color: 'bg-red-500', description: 'Significant optimization required.' },
];

export default function SEOScoreGuidePage() {
    return (
        <ResourcePage
            title="SEO Score Guide"
            subtitle="Free Resource"
            description="Understand how SyncSEO calculates your content's SEO score and how to improve it."
            content={
                <div className="space-y-12">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Score Ranges</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {scoreRanges.map((score, index) => (
                                <div key={index} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                                    <div className={`w-12 h-12 ${score.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                                        {score.range.split('-')[0]}+
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{score.label} ({score.range})</div>
                                        <div className="text-sm text-gray-600">{score.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Scoring Factors</h2>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Factor</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Weight</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">What We Check</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {scoreFactors.map((factor, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-gray-900 font-medium">{factor.name}</td>
                                            <td className="px-6 py-4 text-indigo-600 font-semibold">{factor.weight}</td>
                                            <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{factor.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            }
        />
    );
}
