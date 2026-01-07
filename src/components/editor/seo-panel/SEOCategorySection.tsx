'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SEOCategory } from '@/lib/seo/seo-types';
import { SEOIndicator } from './SEOIndicator';

interface SEOCategorySectionProps {
    category: SEOCategory;
}

export function SEOCategorySection({ category }: SEOCategorySectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasIssues = category.indicators.some(i => i.status !== 'good');
    const allGood = !hasIssues;

    // Determine category status color
    const getCategoryColor = () => {
        const goodCount = category.indicators.filter(i => i.status === 'good').length;
        const ratio = category.indicators.length > 0 ? goodCount / category.indicators.length : 0;

        if (ratio === 1) return '#10B981'; // All good - green
        if (ratio >= 0.5) return '#F59E0B'; // Some issues - orange
        return '#EF4444'; // Many issues - red
    };

    return (
        <div className="border border-gray-100 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                        {category.name}
                    </span>
                    {hasIssues && (
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getCategoryColor() }}
                        />
                    )}
                </div>
                <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded"
                    style={{
                        color: getCategoryColor(),
                        backgroundColor: `${getCategoryColor()}15`
                    }}
                >
                    {Math.round(category.score)}/{category.maxScore}
                </span>
            </button>

            {isExpanded && (
                <div className="px-2 pb-2 space-y-0.5 border-t border-gray-100">
                    {category.indicators.map(indicator => (
                        <SEOIndicator key={indicator.id} indicator={indicator} />
                    ))}
                </div>
            )}
        </div>
    );
}
