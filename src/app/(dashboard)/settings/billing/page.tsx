'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ExternalLink, CreditCard, FileText, AlertCircle, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { PLANS, PlanType } from '@/lib/stripe/config';

interface SubscriptionData {
    plan: PlanType;
    stripe_customer_id: string | null;
    cancel_at_period_end: boolean;
    current_period_end: string | null;
}

export default function BillingSettingsPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isPaidUser, setIsPaidUser] = useState(false);
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

    useEffect(() => {
        async function checkSubscription() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // First, sync with Stripe to ensure we have the latest status
            // This is important when user returns from Stripe Portal
            try {
                await fetch('/api/billing/sync-subscription', { method: 'POST' });
            } catch (err) {
                console.error('Failed to sync with Stripe:', err);
            }

            // Then load from database
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('plan, stripe_customer_id, cancel_at_period_end, current_period_end')
                .eq('user_id', user.id)
                .single();

            if (subData) {
                setSubscription(subData as SubscriptionData);
                // Check if user has a paid plan
                setIsPaidUser(subData.plan !== 'free');
            }
            setIsLoading(false);
        }

        checkSubscription();
    }, [router]);

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!isPaidUser) {
        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Billing</h2>
                    <p className="text-gray-500">Manage your payment method and invoices</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No billing information
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
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

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Billing</h2>
                <p className="text-gray-500">Manage your payment method and invoices</p>
            </div>

            {/* Current Plan Summary */}
            {subscription && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {PLANS[subscription.plan].name} Plan
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            subscription.cancel_at_period_end
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                        }`}>
                            {subscription.cancel_at_period_end ? 'Cancelling' : 'Active'}
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600 mb-2">
                        {PLANS[subscription.plan].price === 0 ? 'Free' : `$${PLANS[subscription.plan].price}/month`}
                    </p>
                    {renewalDate && (
                        <p className="flex items-center gap-2 text-sm text-gray-600">
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
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">Subscription Cancellation Pending</p>
                        <p className="text-sm text-amber-700 mt-1">
                            Your subscription is set to cancel at the end of your billing period ({renewalDate}).
                            You&apos;ll be downgraded to the Free plan after this date.
                            To keep your subscription, visit the <Link href="/settings/subscription" className="underline font-medium">Subscription settings</Link> to reactivate.
                        </p>
                    </div>
                </div>
            )}

            {/* Billing Portal Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Stripe Billing Portal
                        </h3>
                        <p className="text-gray-600 mb-4">
                            View invoices, update your payment method, or manage your subscription through our secure billing portal.
                        </p>
                        <button
                            onClick={handleManageBilling}
                            disabled={isRedirecting || !subscription?.stripe_customer_id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                    In the billing portal you can:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        View and download past invoices
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        Update your payment method
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        Update billing address
                    </li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                    To cancel or change your plan, use the <Link href="/settings/subscription" className="text-indigo-600 hover:underline">Subscription settings</Link> page.
                </p>
            </div>
        </div>
    );
}
