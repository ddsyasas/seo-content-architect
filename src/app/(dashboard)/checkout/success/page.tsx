'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, ArrowRight, Sparkles, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PlanType, PLANS } from '@/lib/stripe/config';

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const [isVerifying, setIsVerifying] = useState(true);
    const [plan, setPlan] = useState<PlanType>('pro');
    const sessionId = searchParams.get('session_id');
    const urlPlan = searchParams.get('plan') as PlanType | null;

    useEffect(() => {
        async function verifyAndFetchPlan() {
            // If plan is in URL, use it immediately (most reliable)
            if (urlPlan && (urlPlan === 'pro' || urlPlan === 'agency')) {
                setPlan(urlPlan);
                // Still wait a bit for webhook to process for database update
                await new Promise(resolve => setTimeout(resolve, 1500));
                setIsVerifying(false);
                return;
            }

            // Fallback: Wait for webhook to process and fetch from database
            await new Promise(resolve => setTimeout(resolve, 2500));

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: subscription } = await supabase
                    .from('subscriptions')
                    .select('plan')
                    .eq('user_id', user.id)
                    .single();

                if (subscription?.plan && subscription.plan !== 'free') {
                    setPlan(subscription.plan as PlanType);
                }
            }

            setIsVerifying(false);
        }

        verifyAndFetchPlan();
    }, [sessionId, urlPlan]);

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Confirming your subscription...
                    </h1>
                    <p className="text-gray-600">
                        Please wait while we activate your plan.
                    </p>
                </div>
            </div>
        );
    }

    const planConfig = PLANS[plan];
    const isAgency = plan === 'agency';
    const PlanIcon = isAgency ? Crown : Sparkles;

    const features = isAgency ? [
        'Unlimited projects',
        'Unlimited articles & nodes',
        'Up to 10 team members per project',
        'Full SEO analysis with history',
        'Priority support',
        'API access (coming soon)',
    ] : [
        'Up to 5 projects',
        '100 articles per project',
        '200 canvas nodes per project',
        'Up to 3 team members per project',
        'Full SEO analysis',
        'Export to PNG & CSV',
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className={`w-16 h-16 ${isAgency ? 'bg-purple-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                        <CheckCircle className={`w-10 h-10 ${isAgency ? 'text-purple-600' : 'text-green-600'}`} />
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-2">
                        <PlanIcon className={`w-5 h-5 ${isAgency ? 'text-purple-600' : 'text-indigo-600'}`} />
                        <span className={`text-sm font-medium ${isAgency ? 'text-purple-600' : 'text-indigo-600'}`}>
                            {planConfig.name} Plan
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome to {planConfig.name}! 🎉
                    </h1>

                    <p className="text-gray-600 mb-6">
                        Your subscription is now active. You have access to all {planConfig.name} features.
                    </p>

                    {/* Feature list */}
                    <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">What you now have access to:</p>
                        <ul className="space-y-1">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <Link
                            href="/dashboard"
                            className={`flex items-center justify-center gap-2 w-full ${isAgency ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-3 px-6 rounded-lg font-medium transition-colors`}
                        >
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <Link
                            href="/settings/subscription"
                            className={`block ${isAgency ? 'text-purple-600 hover:text-purple-800' : 'text-indigo-600 hover:text-indigo-800'} font-medium`}
                        >
                            View subscription details
                        </Link>
                    </div>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    A receipt has been sent to your email.
                </p>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        }>
            <CheckoutSuccessContent />
        </Suspense>
    );
}
