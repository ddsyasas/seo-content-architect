'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { PLANS, PlanType } from '@/lib/stripe/config';
import { Button } from '@/components/ui/button';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { createClient } from '@/lib/supabase/client';

interface PricingCardProps {
    plan: PlanType;
    currentPlan?: PlanType;
    isLoggedIn: boolean;
    onUpgrade: (plan: PlanType) => void;
    onCancel: () => void;
    isLoading: boolean;
    isCancelling: boolean;
}

function PricingCard({ plan, currentPlan, isLoggedIn, onUpgrade, onCancel, isLoading, isCancelling }: PricingCardProps) {
    const config = PLANS[plan];
    const isCurrentPlan = currentPlan === plan;
    const isPro = plan === 'pro';

    const features = [
        {
            name: `${config.limits.projects === 999999 ? 'Unlimited' : config.limits.projects} project${config.limits.projects !== 1 ? 's' : ''}`,
            included: true
        },
        {
            name: `${config.limits.articlesPerProject === 999999 ? 'Unlimited' : config.limits.articlesPerProject} articles per project`,
            included: true
        },
        {
            name: `${config.limits.nodesPerProject === 999999 ? 'Unlimited' : config.limits.nodesPerProject} canvas nodes per project`,
            included: true
        },
        {
            name: `${config.limits.teamMembersPerProject === 1 ? 'Solo (owner only)' : config.limits.teamMembersPerProject + ' team members'}`,
            included: true
        },
        {
            name: config.features.seoScore === 'basic' ? 'Basic SEO score' : 'Full SEO analysis',
            included: true
        },
        {
            name: 'Export (PNG, CSV)',
            included: config.features.export
        },
        {
            name: plan === 'agency' ? 'Priority support' : plan === 'pro' ? 'Email support' : 'Community support',
            included: true
        },
    ];

    const getButtonText = () => {
        if (isCurrentPlan) return 'Current Plan';
        if (!isLoggedIn) return plan === 'free' ? 'Start Free' : `Get ${config.name}`;
        if (plan === 'free') return 'Switch to Free';

        // Check if this is a downgrade (current plan is higher)
        const planOrder = { free: 0, pro: 1, agency: 2 };
        const currentPlanLevel = currentPlan ? planOrder[currentPlan] : 0;
        const targetPlanLevel = planOrder[plan];

        if (targetPlanLevel < currentPlanLevel) {
            return `Downgrade to ${config.name}`;
        }
        return `Upgrade to ${config.name}`;
    };

    const handleClick = () => {
        if (isCurrentPlan) return;
        if (!isLoggedIn) {
            // Redirect to signup
            window.location.href = '/signup';
            return;
        }
        if (plan === 'free') {
            // Confirm and cancel subscription
            if (confirm('Are you sure you want to switch to Free? Your subscription will be cancelled.')) {
                onCancel();
            }
            return;
        }
        onUpgrade(plan);
    };

    return (
        <div className={`relative rounded-2xl border-2 p-8 flex flex-col ${isPro
            ? 'border-indigo-500 bg-gradient-to-b from-indigo-50/50 to-white shadow-xl scale-105'
            : 'border-gray-200 bg-white'
            }`}>
            {isPro && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                        <Sparkles className="w-4 h-4" />
                        Most Popular
                    </span>
                </div>
            )}

            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{config.name}</h3>
                {isPro ? (
                    <>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-2xl text-gray-400 line-through">$19</span>
                            <span className="text-4xl font-bold text-gray-900">$7</span>
                            <span className="text-gray-500">/month</span>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                            Limited Time Offer - 63% OFF
                        </div>
                    </>
                ) : (
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                            {config.price === 0 ? 'Free' : `$${config.price}`}
                        </span>
                        {config.price > 0 && (
                            <span className="text-gray-500">/month</span>
                        )}
                    </div>
                )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                        {feature.included ? (
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                            <X className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                            {feature.name}
                        </span>
                    </li>
                ))}
            </ul>

            <button
                onClick={handleClick}
                disabled={isCurrentPlan || isLoading || isCancelling}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${(() => {
                    if (isCurrentPlan) return 'bg-gray-100 text-gray-500 cursor-not-allowed';

                    // Check if this is a downgrade
                    const planOrder = { free: 0, pro: 1, agency: 2 };
                    const currentPlanLevel = currentPlan ? planOrder[currentPlan] : 0;
                    const targetPlanLevel = planOrder[plan];
                    const isDowngrade = targetPlanLevel < currentPlanLevel;

                    if (isDowngrade || plan === 'free') {
                        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300';
                    }

                    if (isPro) {
                        return 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200';
                    }
                    if (plan === 'agency') {
                        return 'bg-gray-900 text-white hover:bg-gray-800';
                    }
                    return 'bg-gray-100 text-gray-900 hover:bg-gray-200';
                })()}`}
            >
                {(isLoading || (plan === 'free' && isCancelling)) ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                    getButtonText()
                )}
            </button>
        </div>
    );
}

export default function PricingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<PlanType | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Check authentication status and current plan
    useEffect(() => {
        async function checkAuth() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setIsLoggedIn(true);

                // Fetch current subscription
                const { data: subscription } = await supabase
                    .from('subscriptions')
                    .select('plan')
                    .eq('user_id', user.id)
                    .single();

                if (subscription?.plan) {
                    setCurrentPlan(subscription.plan as PlanType);
                }
            }
            setIsCheckingAuth(false);
        }

        checkAuth();
    }, []);

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

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            const response = await fetch('/api/billing/cancel-subscription', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setCurrentPlan('free');
                alert('Subscription cancelled. You are now on the Free plan.');
            } else {
                alert(data.error || 'Failed to cancel subscription');
            }
        } catch (error) {
            console.error('Cancel error:', error);
            alert('Failed to cancel subscription. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const faqs = [
        {
            question: 'Can I change plans later?',
            answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated amount. When downgrading, the change takes effect at the end of your billing period.',
        },
        {
            question: 'What happens if I exceed my limits?',
            answer: 'You\'ll see a prompt to upgrade when you reach your plan limits. Your existing content is never deleted - you just can\'t add more until you upgrade or remove some content.',
        },
        {
            question: 'How does team billing work?',
            answer: 'Team members don\'t need their own subscription. The project owner\'s plan determines the team size limit. Team members get their own free account to access shared projects.',
        },
        {
            question: 'Can I cancel anytime?',
            answer: 'Absolutely. You can cancel your subscription at any time from your account settings. You\'ll continue to have access to paid features until the end of your billing period.',
        },
        {
            question: 'Do you offer refunds?',
            answer: 'We offer a full refund within 14 days of your first purchase if you\'re not satisfied. Contact support and we\'ll process your refund promptly.',
        },
    ];

    return (
        <MarketingLayout>
            {/* Hero */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Start free, upgrade when you need more. No hidden fees, no surprises.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-16 md:pb-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 items-start">
                        <PricingCard
                            plan="free"
                            currentPlan={currentPlan}
                            isLoggedIn={isLoggedIn}
                            onUpgrade={handleUpgrade}
                            onCancel={handleCancel}
                            isLoading={isLoading === 'free'}
                            isCancelling={isCancelling}
                        />
                        <PricingCard
                            plan="pro"
                            currentPlan={currentPlan}
                            isLoggedIn={isLoggedIn}
                            onUpgrade={handleUpgrade}
                            onCancel={handleCancel}
                            isLoading={isLoading === 'pro'}
                            isCancelling={isCancelling}
                        />
                        <PricingCard
                            plan="agency"
                            currentPlan={currentPlan}
                            isLoggedIn={isLoggedIn}
                            onUpgrade={handleUpgrade}
                            onCancel={handleCancel}
                            isLoading={isLoading === 'agency'}
                            isCancelling={isCancelling}
                        />
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 bg-gray-50 border-t border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {faq.question}
                                </h3>
                                <p className="text-gray-600">
                                    {faq.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </MarketingLayout>
    );
}
