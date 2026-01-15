'use client';

import { X, AlertTriangle, ArrowUp, ArrowDown, CreditCard } from 'lucide-react';
import { PLANS, PlanType } from '@/lib/stripe/config';

interface PlanChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    currentPlan: PlanType;
    targetPlan: PlanType;
    isLoading?: boolean;
}

export function PlanChangeModal({
    isOpen,
    onClose,
    onConfirm,
    currentPlan,
    targetPlan,
    isLoading = false,
}: PlanChangeModalProps) {
    if (!isOpen) return null;

    const planOrder = { free: 0, pro: 1, agency: 2 };
    const isUpgrade = planOrder[targetPlan] > planOrder[currentPlan];
    const isDowngrade = planOrder[targetPlan] < planOrder[currentPlan];

    const currentConfig = PLANS[currentPlan];
    const targetConfig = PLANS[targetPlan];

    // Calculate price difference for upgrades
    const priceDiff = targetConfig.price - currentConfig.price;

    const getTitle = () => {
        if (isUpgrade) return `Upgrade to ${targetConfig.name}`;
        if (isDowngrade) return `Downgrade to ${targetConfig.name}`;
        return 'Change Plan';
    };

    const getIcon = () => {
        if (isUpgrade) return <ArrowUp className="w-6 h-6 text-green-600" />;
        if (isDowngrade) return <ArrowDown className="w-6 h-6 text-amber-600" />;
        return <CreditCard className="w-6 h-6 text-blue-600" />;
    };

    const getDescription = () => {
        if (isUpgrade) {
            return (
                <>
                    <p className="text-gray-600 mb-4">
                        You're about to upgrade from <strong>{currentConfig.name}</strong> to{' '}
                        <strong>{targetConfig.name}</strong>.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-blue-900">Immediate Charge</p>
                                <p className="text-sm text-blue-700">
                                    You'll be charged approximately <strong>${priceDiff}</strong> now for the
                                    prorated difference. Your next billing will be <strong>${targetConfig.price}/month</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        Your upgrade takes effect immediately with access to all {targetConfig.name} features.
                    </p>
                </>
            );
        }

        if (isDowngrade) {
            return (
                <>
                    <p className="text-gray-600 mb-4">
                        You're about to downgrade from <strong>{currentConfig.name}</strong> to{' '}
                        <strong>{targetConfig.name}</strong>.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-900">What happens next</p>
                                <p className="text-sm text-amber-700">
                                    {targetPlan === 'free' ? (
                                        <>Your subscription will be cancelled. You'll keep access to {currentConfig.name} features until the end of your billing period.</>
                                    ) : (
                                        <>The change takes effect at the end of your billing period. You'll keep {currentConfig.name} features until then.</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        You can upgrade again anytime to regain access to premium features.
                    </p>
                </>
            );
        }

        return <p>Confirm your plan change.</p>;
    };

    const getConfirmButtonText = () => {
        if (isLoading) return 'Processing...';
        if (isUpgrade) return `Upgrade & Pay ~$${priceDiff}`;
        if (isDowngrade && targetPlan === 'free') return 'Cancel Subscription';
        if (isDowngrade) return `Downgrade to ${targetConfig.name}`;
        return 'Confirm';
    };

    const getConfirmButtonStyle = () => {
        if (isUpgrade) return 'bg-green-600 hover:bg-green-700 text-white';
        if (isDowngrade) return 'bg-amber-600 hover:bg-amber-700 text-white';
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-full ${isUpgrade ? 'bg-green-100' : isDowngrade ? 'bg-amber-100' : 'bg-blue-100'}`}>
                        {getIcon()}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
                </div>

                {/* Content */}
                <div className="mb-6">
                    {getDescription()}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${getConfirmButtonStyle()}`}
                    >
                        {getConfirmButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
}
