'use client';

import { getProgressColor } from '@/lib/utils/plan-limits';

interface UsageIndicatorProps {
    label: string;
    current: number;
    limit: number;
    showUpgrade?: boolean;
    onUpgrade?: () => void;
    compact?: boolean;
}

export function UsageIndicator({
    label,
    current,
    limit,
    showUpgrade = false,
    onUpgrade,
    compact = false
}: UsageIndicatorProps) {
    const isUnlimited = limit >= 999999;
    const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
    const progressColor = getProgressColor(percentage);

    const displayLimit = isUnlimited ? '∞' : limit;

    if (compact) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{label}:</span>
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${progressColor}`}
                            style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
                        />
                    </div>
                    <span className="text-gray-700 font-medium">
                        {current}/{displayLimit}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm text-gray-600">
                    {current} of {displayLimit}
                </span>
            </div>

            <div className="relative">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                        style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
                    />
                </div>
            </div>

            {showUpgrade && percentage >= 80 && onUpgrade && (
                <button
                    onClick={onUpgrade}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                    Upgrade for {isUnlimited ? 'unlimited' : 'more'} →
                </button>
            )}
        </div>
    );
}

interface UsageOverviewProps {
    plan: string;
    usage: {
        projects?: { current: number; limit: number };
        articles?: { current: number; limit: number };
        nodes?: { current: number; limit: number };
        teamMembers?: { current: number; limit: number };
    };
    onUpgrade?: () => void;
}

export function UsageOverview({ plan, usage, onUpgrade }: UsageOverviewProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Usage Overview</h3>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full capitalize">
                    {plan} Plan
                </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {usage.projects && (
                    <UsageIndicator
                        label="Projects"
                        current={usage.projects.current}
                        limit={usage.projects.limit}
                        showUpgrade
                        onUpgrade={onUpgrade}
                    />
                )}
                {usage.articles && (
                    <UsageIndicator
                        label="Articles"
                        current={usage.articles.current}
                        limit={usage.articles.limit}
                        showUpgrade
                        onUpgrade={onUpgrade}
                    />
                )}
                {usage.nodes && (
                    <UsageIndicator
                        label="Canvas Nodes"
                        current={usage.nodes.current}
                        limit={usage.nodes.limit}
                        showUpgrade
                        onUpgrade={onUpgrade}
                    />
                )}
                {usage.teamMembers && (
                    <UsageIndicator
                        label="Team Members"
                        current={usage.teamMembers.current}
                        limit={usage.teamMembers.limit}
                        showUpgrade
                        onUpgrade={onUpgrade}
                    />
                )}
            </div>
        </div>
    );
}
