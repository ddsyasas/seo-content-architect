'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowUpRight, Calendar, AlertCircle, Wrench } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PLANS, PlanType, getPlanLimits } from '@/lib/stripe/config';
import { UsageOverview } from '@/components/billing/UsageIndicator';

interface Subscription {
    plan: PlanType;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
}

interface UsageData {
    projects: { current: number; limit: number };
    totalArticles: number;
    totalNodes: number;
    totalTeamMembers: number;
}

// DEV MODE FLAG - Set to true to enable plan switching without Stripe
const DEV_MODE = true;

export default function SubscriptionSettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSwitching, setIsSwitching] = useState(false);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<UsageData | null>(null);

    const loadData = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        // Load subscription
        const { data: subData } = await supabase
            .from('subscriptions')
            .select('plan, status, current_period_end, cancel_at_period_end')
            .eq('user_id', user.id)
            .single();

        if (subData) {
            setSubscription(subData as Subscription);
        } else {
            // Default to free plan
            setSubscription({
                plan: 'free',
                status: 'active',
                current_period_end: null,
                cancel_at_period_end: false,
            });
        }

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

        const plan = subData?.plan || 'free';
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
        loadData();
    }, [router]);

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
                    current_period_end: newPlan !== 'free'
                        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        : null,
                })
                .eq('user_id', user.id);

            if (error) {
                console.error('Error switching plan:', error);
                alert('Failed to switch plan. Make sure the subscriptions table exists.');
            } else {
                // Reload data
                await loadData();
                alert(`Successfully switched to ${PLANS[newPlan].name} plan!`);
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
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Subscription</h2>
                <p className="text-gray-500">Manage your plan and view usage</p>
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
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {planConfig.name} Plan
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${subscription?.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : subscription?.status === 'past_due'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                {subscription?.status === 'active' ? 'Active' :
                                    subscription?.status === 'past_due' ? 'Past Due' : 'Inactive'}
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-indigo-600">
                            {planConfig.price === 0 ? 'Free' : `$${planConfig.price}/month`}
                        </p>
                        {renewalDate && (
                            <p className="flex items-center gap-2 text-sm text-gray-600 mt-2">
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
                    <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-700">
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
                <div className="flex flex-wrap gap-4">
                    {subscription?.plan !== 'free' && (
                        <Link
                            href="/settings/billing"
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Manage billing →
                        </Link>
                    )}
                    {subscription?.plan !== 'free' && !subscription?.cancel_at_period_end && (
                        <button
                            className="text-gray-500 hover:text-gray-700 font-medium"
                            onClick={() => {
                                if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
                                    alert('Please use the Billing page to cancel your subscription through Stripe.');
                                }
                            }}
                        >
                            Cancel subscription
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

