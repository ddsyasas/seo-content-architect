'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ExternalLink, CreditCard, FileText, AlertCircle, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PLANS } from '@/lib/stripe/config';
import type { SubscriptionData } from './page';

interface BillingPageContentProps {
    subscription: SubscriptionData | null;
    isPaidUser: boolean;
}

/**
 * Client Component: Handles interactive billing features
 * - Manage Billing button (redirects to Stripe portal)
 * - Toast notifications
 */
export function BillingPageContent({ subscription, isPaidUser }: BillingPageContentProps) {
    const { addToast } = useToast();
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleManageBilling = async () => {
        setIsRedirecting(true);
        try {
            const response = await fetch('/api/billing/create-portal-session', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                addToast({
                    type: 'error',
                    title: 'Portal Error',
                    message: data.error || 'Failed to open billing portal',
                });
                setIsRedirecting(false);
            }
        } catch (error) {
            console.error('Portal error:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to open billing portal. Please try again.',
            });
            setIsRedirecting(false);
        }
    };

    const renewalDate = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        : null;

    // Free user view
    if (!isPaidUser) {
        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Billing</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage your payment method and invoices</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <CreditCard className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No billing information
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        You&apos;re currently on the Free plan. Upgrade to a paid plan to access billing features.
                    </p>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        View Plans
                    </Link>
                </div>
            </div>
        );
    }

    // Paid user view
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Billing</h2>
                <p className="text-gray-500 dark:text-gray-400">Manage your payment method and invoices</p>
            </div>

            {/* Current Plan Summary */}
            {subscription && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {PLANS[subscription.plan].name} Plan
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            subscription.cancel_at_period_end
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                            {subscription.cancel_at_period_end ? 'Cancelling' : 'Active'}
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                        {PLANS[subscription.plan].price === 0 ? 'Free' : `$${PLANS[subscription.plan].price}/month`}
                    </p>
                    {renewalDate && (
                        <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {subscription.cancel_at_period_end
                                ? `Access ends on ${renewalDate}`
                                : `Renews on ${renewalDate}`
                            }
                        </p>
                    )}
                </div>
            )}

            {/* Pending Cancellation Warning */}
            {subscription?.cancel_at_period_end && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800 dark:text-amber-300">Subscription Cancellation Pending</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                            Your subscription is set to cancel at the end of your billing period ({renewalDate}).
                            You&apos;ll be downgraded to the Free plan after this date.
                            To keep your subscription, visit the <Link href="/settings/subscription" className="underline font-medium">Subscription settings</Link> to reactivate.
                        </p>
                    </div>
                </div>
            )}

            {/* Billing Portal Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Stripe Billing Portal
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            View invoices, update your payment method, or manage your subscription through our secure billing portal.
                        </p>
                        <button
                            onClick={handleManageBilling}
                            disabled={isRedirecting || !subscription?.stripe_customer_id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                            {isRedirecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ExternalLink className="w-4 h-4" />
                            )}
                            Manage Billing
                        </button>
                        {!subscription?.stripe_customer_id && subscription?.plan !== 'free' && (
                            <p className="text-sm text-amber-600 mt-2">
                                Billing portal not available. Your subscription may need to be set up properly.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* What you can do */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    In the billing portal you can:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
                        View and download past invoices
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
                        Update your payment method
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
                        Update billing address
                    </li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    To cancel or change your plan, use the <Link href="/settings/subscription" className="text-indigo-600 hover:underline">Subscription settings</Link> page.
                </p>
            </div>
        </div>
    );
}
