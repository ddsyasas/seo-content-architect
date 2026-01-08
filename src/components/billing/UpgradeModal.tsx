'use client';

import { useState } from 'react';
import { X, Loader2, Check, Sparkles } from 'lucide-react';
import { PLANS, PlanType } from '@/lib/stripe/config';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceType: 'projects' | 'articles' | 'nodes' | 'teamMembers';
    currentLimit: number;
    currentPlan: PlanType;
}

export function UpgradeModal({
    isOpen,
    onClose,
    resourceType,
    currentLimit,
    currentPlan
}: UpgradeModalProps) {
    const [isLoading, setIsLoading] = useState<PlanType | null>(null);

    if (!isOpen) return null;

    const resourceLabels: Record<string, string> = {
        projects: 'projects',
        articles: 'articles',
        nodes: 'canvas nodes',
        teamMembers: 'team members',
    };

    const getUpgradeLimit = (plan: PlanType, resource: string): string => {
        const limits = PLANS[plan].limits;
        const value = limits[resource as keyof typeof limits];
        return value >= 999999 ? 'Unlimited' : String(value);
    };

    const handleUpgrade = async (plan: PlanType) => {
        setIsLoading(plan);
        try {
            const response = await fetch('/api/billing/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Failed to start checkout');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setIsLoading(null);
        }
    };

    const upgradePlans = currentPlan === 'free'
        ? ['pro', 'agency'] as PlanType[]
        : currentPlan === 'pro'
            ? ['agency'] as PlanType[]
            : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-indigo-600" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    Upgrade to unlock more
                </h2>

                {/* Message */}
                <p className="text-gray-600 text-center mb-6">
                    You&apos;ve reached the limit of{' '}
                    <span className="font-semibold">{currentLimit} {resourceLabels[resourceType]}</span>
                    {' '}on the {PLANS[currentPlan].name} plan.
                </p>

                {/* Upgrade benefits */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                        Upgrade to get:
                    </p>
                    <ul className="space-y-2">
                        {upgradePlans.map((plan) => (
                            <li key={plan} className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>
                                    <span className="font-medium">{PLANS[plan].name}:</span>
                                    {' '}Up to {getUpgradeLimit(plan, resourceType)} {resourceLabels[resourceType]}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Upgrade buttons */}
                <div className="space-y-3">
                    {upgradePlans.map((plan) => (
                        <button
                            key={plan}
                            onClick={() => handleUpgrade(plan)}
                            disabled={!!isLoading}
                            className={`w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${plan === 'pro'
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            {isLoading === plan ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Upgrade to {PLANS[plan].name} - ${PLANS[plan].price}/month
                                </>
                            )}
                        </button>
                    ))}
                </div>

                {/* Dismiss link */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}
