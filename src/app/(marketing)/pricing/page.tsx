'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { PLANS, PlanType } from '@/lib/stripe/config';
import { Button } from '@/components/ui/button';

interface PricingCardProps {
    plan: PlanType;
    currentPlan?: PlanType;
    isLoggedIn: boolean;
    onUpgrade: (plan: PlanType) => void;
    isLoading: boolean;
}

function PricingCard({ plan, currentPlan, isLoggedIn, onUpgrade, isLoading }: PricingCardProps) {
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
        return `Upgrade to ${config.name}`;
    };

    const handleClick = () => {
        if (isCurrentPlan) return;
        if (!isLoggedIn) {
            // Redirect to signup
            window.location.href = '/signup';
            return;
        }
        if (plan === 'free') return;
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
                disabled={isCurrentPlan || isLoading}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${isCurrentPlan
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : isPro
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                        : plan === 'agency'
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
            >
                {isLoading ? (
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

    // In a real app, you'd fetch these from the session
    const isLoggedIn = false; // Will be updated with actual auth check
    const currentPlan: PlanType = 'free';

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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="py-6 px-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/SyncSEO Header logo 2-min.png"
                            alt="SyncSEO"
                            width={140}
                            height={40}
                            priority
                        />
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Features
                        </Link>
                        <Link href="/pricing" className="text-indigo-600 font-medium">
                            Pricing
                        </Link>
                        <Link href="/resources" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Resources
                        </Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Login
                        </Link>
                        <Link href="/signup">
                            <Button>Get Started Free</Button>
                        </Link>
                    </div>
                </div>
            </header>

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
                            isLoading={isLoading === 'free'}
                        />
                        <PricingCard
                            plan="pro"
                            currentPlan={currentPlan}
                            isLoggedIn={isLoggedIn}
                            onUpgrade={handleUpgrade}
                            isLoading={isLoading === 'pro'}
                        />
                        <PricingCard
                            plan="agency"
                            currentPlan={currentPlan}
                            isLoggedIn={isLoggedIn}
                            onUpgrade={handleUpgrade}
                            isLoading={isLoading === 'agency'}
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

            {/* Footer */}
            <footer className="py-8 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
                    <p>© {new Date().getFullYear()} SyncSEO. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
