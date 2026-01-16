'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowUpRight, Calendar, AlertCircle, Wrench, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PLANS, PlanType, getPlanLimits } from '@/lib/stripe/config';
import { UsageOverview } from '@/components/billing/UsageIndicator';
import { useToast } from '@/components/ui/toast';

interface Subscription {
    plan: PlanType;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    stripe_subscription_id: string | null;
}

interface UsageData {
    projects: { current: number; limit: number };
    totalArticles: number;
    totalNodes: number;
    totalTeamMembers: number;
}

// DEV MODE FLAG - Set to false to test real Stripe flow
// Enable with ENABLE_DEV_MODE=true in .env.local if needed
const DEV_MODE = process.env.ENABLE_DEV_MODE === 'true';

export default function SubscriptionSettingsPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<UsageData | null>(null);

    const loadData = async (syncWithStripe = false) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        let subscriptionData: Subscription | null = null;

        // If syncWithStripe is true, sync with Stripe first to get latest status
        if (syncWithStripe) {
            try {
                const syncResponse = await fetch('/api/billing/sync-subscription', {
                    method: 'POST',
                });
                const syncData = await syncResponse.json();
                if (syncData.success && syncData.subscription) {
                    // Use the synced data directly - don't re-read from database
                    subscriptionData = {
                        plan: syncData.subscription.plan,
                        status: syncData.subscription.status,
                        current_period_end: syncData.subscription.current_period_end || null,
                        cancel_at_period_end: syncData.subscription.cancel_at_period_end,
                        stripe_subscription_id: syncData.subscription.stripe_subscription_id || null,
                    } as Subscription;
                }
            } catch (err) {
                console.error('Failed to sync with Stripe:', err);
            }
        }

        // Only load from database if we didn't get data from sync
        if (!subscriptionData) {
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('plan, status, current_period_end, cancel_at_period_end, stripe_subscription_id')
                .eq('user_id', user.id)
                .single();

            if (subData) {
                subscriptionData = subData as Subscription;
            } else {
                // Default to free plan
                subscriptionData = {
                    plan: 'free',
                    status: 'active',
                    current_period_end: null,
                    cancel_at_period_end: false,
                    stripe_subscription_id: null,
                };
            }
        }

        setSubscription(subscriptionData);

        // Load usage counts
        const [projectsRes, articlesRes, nodesRes, teamRes] = await Promise.all([
            supabase
                .from('projects')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id),
            supabase
                .from('nodes')
                .select('id', { count: 'exact' })
                .neq('node_type', 'external'),
            supabase
                .from('nodes')
                .select('id', { count: 'exact' }),
            supabase
                .from('team_members')
                .select('id', { count: 'exact' }),
        ]);

        const plan = subscriptionData?.plan || 'free';
        const limits = getPlanLimits(plan);

        setUsage({
            projects: { current: projectsRes.count || 0, limit: limits.projects },
            totalArticles: articlesRes.count || 0,
            totalNodes: nodesRes.count || 0,
            totalTeamMembers: teamRes.count || 0,
        });

        setIsLoading(false);
    };

    useEffect(() => {
        // Sync with Stripe on initial load to ensure data is up-to-date
        loadData(true);
    }, [router]);

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will keep access to premium features until the end of your billing period.')) {
            return;
        }

        setIsCancelling(true);
        try {
            const response = await fetch('/api/billing/update-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: 'free' }),
            });

            const data = await response.json();

            if (data.success) {
                addToast({
                    type: 'success',
                    title: 'Subscription Cancelled',
                    message: 'Your subscription will end at the billing period. You\'ll keep access until then.',
                    duration: 6000,
                });
                // Reload data and sync to show updated status
                await loadData(true);
            } else {
                const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
                addToast({
                    type: 'error',
                    title: 'Cancellation Failed',
                    message: errorMsg || 'Failed to cancel subscription',
                });
            }
        } catch (error) {
            console.error('Cancel error:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to cancel subscription. Please try again.',
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const handleReactivateSubscription = async () => {
        setIsReactivating(true);
        try {
            // To reactivate, we need to update the subscription to remove cancel_at_period_end
            const response = await fetch('/api/billing/reactivate-subscription', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                addToast({
                    type: 'success',
                    title: 'Subscription Reactivated',
                    message: 'Your subscription has been reactivated and will continue normally.',
                    duration: 6000,
                });
                // Reload data to show updated status
                await loadData(true);
            } else {
                const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
                addToast({
                    type: 'error',
                    title: 'Reactivation Failed',
                    message: errorMsg || 'Failed to reactivate subscription',
                });
            }
        } catch (error) {
            console.error('Reactivate error:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to reactivate subscription. Please try again.',
            });
        } finally {
            setIsReactivating(false);
        }
    };

    const handleSyncStatus = async () => {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/billing/sync-subscription', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                if (data.synced) {
                    addToast({
                        type: 'success',
                        title: 'Status Synced',
                        message: data.message || 'Subscription status has been synced with Stripe.',
                        duration: 4000,
                    });
                }
                // Reload data to show updated status
                await loadData(false);
            } else {
                addToast({
                    type: 'error',
                    title: 'Sync Failed',
                    message: data.error || 'Failed to sync subscription status',
                });
            }
        } catch (error) {
            console.error('Sync error:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to sync subscription status. Please try again.',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // DEV MODE: Switch plan directly in database
    const handleDevPlanSwitch = async (newPlan: PlanType) => {
        setIsSwitching(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { error } = await supabase
                .from('subscriptions')
                .update({
                    plan: newPlan,
                    status: 'active',
                    cancel_at_period_end: false,
                    current_period_end: newPlan !== 'free'
                        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        : null,
                })
                .eq('user_id', user.id);

            if (error) {
                console.error('Error switching plan:', error);
                addToast({
                    type: 'error',
                    title: 'Switch Failed',
                    message: 'Failed to switch plan. Make sure the subscriptions table exists.',
                });
            } else {
                // Reload data
                await loadData();
                addToast({
                    type: 'success',
                    title: 'Plan Switched',
                    message: `Successfully switched to ${PLANS[newPlan].name} plan!`,
                });
            }
        } catch (err) {
            console.error('Plan switch error:', err);
        } finally {
            setIsSwitching(false);
        }
    };

    const handleUpgrade = () => {
        router.push('/pricing');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const planConfig = PLANS[subscription?.plan || 'free'];
    const renewalDate = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        : null;

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Subscription</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage your plan and view usage</p>
                </div>
                {!DEV_MODE && subscription?.stripe_subscription_id && (
                    <button
                        onClick={handleSyncStatus}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        title="Sync subscription status with Stripe"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Refresh status'}
                    </button>
                )}
            </div>

            {/* DEV MODE: Plan Switcher */}
            {DEV_MODE && (
                <div className="bg-yellow-50 border-2 border-yellow-300 border-dashed rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Wrench className="w-5 h-5 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-yellow-800">Dev Mode: Plan Switcher</h3>
                    </div>
                    <p className="text-sm text-yellow-700 mb-4">
                        Bypass Stripe and switch plans directly to test features. Remove this in production.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {(['free', 'pro', 'agency'] as PlanType[]).map((plan) => (
                            <button
                                key={plan}
                                onClick={() => handleDevPlanSwitch(plan)}
                                disabled={isSwitching || subscription?.plan === plan}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${subscription?.plan === plan
                                    ? 'bg-yellow-600 text-white cursor-not-allowed'
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    }`}
                            >
                                {isSwitching ? (
                                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                ) : null}
                                {plan === subscription?.plan ? `✓ ${PLANS[plan].name}` : `Switch to ${PLANS[plan].name}`}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 text-xs text-yellow-600">
                        Current limits: {planConfig.limits.projects === 999999 ? 'Unlimited' : planConfig.limits.projects} projects,
                        {' '}{planConfig.limits.articlesPerProject === 999999 ? 'Unlimited' : planConfig.limits.articlesPerProject} articles/project,
                        {' '}{planConfig.limits.teamMembersPerProject} team members
                    </div>
                </div>
            )}

            {/* Current Plan */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {planConfig.name} Plan
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${subscription?.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : subscription?.status === 'past_due'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                {subscription?.status === 'active' ? 'Active' :
                                    subscription?.status === 'past_due' ? 'Past Due' : 'Inactive'}
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                            {planConfig.price === 0 ? 'Free' : `$${planConfig.price}/month`}
                        </p>
                        {renewalDate && (
                            <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                                <Calendar className="w-4 h-4" />
                                {subscription?.cancel_at_period_end
                                    ? `Cancels on ${renewalDate}`
                                    : `Renews on ${renewalDate}`
                                }
                            </p>
                        )}
                    </div>

                    {subscription?.plan !== 'agency' && !DEV_MODE && (
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Upgrade
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {subscription?.cancel_at_period_end && (
                    <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Your subscription is set to cancel at the end of the billing period.
                            You&apos;ll be downgraded to the Free plan after {renewalDate}.
                        </p>
                    </div>
                )}
            </div>

            {/* Usage Overview */}
            {usage && subscription && (
                <UsageOverview
                    plan={subscription.plan}
                    usage={{
                        projects: usage.projects,
                    }}
                    onUpgrade={handleUpgrade}
                />
            )}

            {/* Plan Actions */}
            {!DEV_MODE && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Actions</h3>
                    <div className="flex flex-wrap gap-4">
                        {subscription?.plan !== 'free' && (
                            <Link
                                href="/settings/billing"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Manage billing
                                <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        )}
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                            {subscription?.plan === 'agency' ? 'View plans' : 'Upgrade plan'}
                        </Link>
                        {subscription?.plan !== 'free' && subscription?.stripe_subscription_id && !subscription?.cancel_at_period_end && (
                            <button
                                onClick={handleCancelSubscription}
                                disabled={isCancelling}
                                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isCancelling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : null}
                                Cancel subscription
                            </button>
                        )}
                        {subscription?.cancel_at_period_end && subscription?.stripe_subscription_id && (
                            <button
                                onClick={handleReactivateSubscription}
                                disabled={isReactivating}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                            >
                                {isReactivating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                Reactivate subscription
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

