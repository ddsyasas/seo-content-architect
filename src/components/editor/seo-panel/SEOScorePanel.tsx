'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Target } from 'lucide-react';
import { SEOScoreResult } from '@/lib/seo/seo-types';
import { SEO_CONFIG } from '@/lib/seo/seo-config';
import { SEOScoreGauge } from './SEOScoreGauge';
import { SEOCategorySection } from './SEOCategorySection';

interface SEOScorePanelProps {
    score: SEOScoreResult | null;
    isLoading?: boolean;
}

export function SEOScorePanel({ score, isLoading }: SEOScorePanelProps) {
    const [isExpanded, setIsExpanded] = useState(SEO_CONFIG.ui.defaultExpanded);

    if (!score) {
        return (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Target className="w-4 h-4" />
                    <span>Enter a target keyword to see SEO analysis</span>
                </div>
            </div>
        );
    }

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left group"
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                    <span className="font-semibold text-gray-900 dark:text-white">SEO Score</span>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="text-lg font-bold"
                        style={{ color: score.zoneColor }}
                    >
                        {score.totalScore}/100
                    </span>
                </div>
            </button>

            {/* Mini progress bar - Always Visible */}
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${score.totalScore}%`,
                        backgroundColor: score.zoneColor
                    }}
                />
            </div>
            <div className="mt-1 flex items-center justify-between">
                <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                        color: score.zoneColor,
                        backgroundColor: `${score.zoneColor}15`
                    }}
                >
                    {score.zoneLabel}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    Click to {isExpanded ? 'collapse' : 'expand'}
                </span>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="mt-4 space-y-3">
                    {/* Gauge */}
                    <SEOScoreGauge score={score.totalScore} color={score.zoneColor} />

                    {/* Categories */}
                    <div className="space-y-2">
                        <SEOCategorySection category={score.categories.targetKeyword} />
                        <SEOCategorySection category={score.categories.metaElements} />
                        <SEOCategorySection category={score.categories.contentStructure} />
                        <SEOCategorySection category={score.categories.readability} />
                        <SEOCategorySection category={score.categories.internalLinks} />
                        <SEOCategorySection category={score.categories.images} />
                        <SEOCategorySection category={score.categories.outboundLinks} />
                    </div>
                </div>
            )}
        </div>
    );
}
