'use client';

import { SEOIndicator as SEOIndicatorType } from '@/lib/seo/seo-types';

const statusColors = {
    good: '#10B981',   // Green
    okay: '#F59E0B',   // Orange
    poor: '#EF4444',   // Red
};

interface SEOIndicatorProps {
    indicator: SEOIndicatorType;
}

export function SEOIndicator({ indicator }: SEOIndicatorProps) {
    return (
        <div className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
            <span
                className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusColors[indicator.status] }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {indicator.message}
            </span>
        </div>
    );
}
