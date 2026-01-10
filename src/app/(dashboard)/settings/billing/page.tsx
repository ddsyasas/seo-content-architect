'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ExternalLink, CreditCard, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function BillingSettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isPaidUser, setIsPaidUser] = useState(false);

    useEffect(() => {
        async function checkSubscription() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('plan, stripe_customer_id')
                .eq('user_id', user.id)
                .single();

            // Check if user has a paid plan (not requiring stripe_customer_id since plan can be updated client-side)
            setIsPaidUser(subscription?.plan !== 'free' && subscription?.plan !== undefined);
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
                alert(data.error || 'Failed to open billing portal');
                setIsRedirecting(false);
            }
        } catch (error) {
            console.error('Portal error:', error);
            alert('Failed to open billing portal. Please try again.');
            setIsRedirecting(false);
        }
    };

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
                            View invoices, update your payment method, or cancel your subscription through our secure billing portal.
                        </p>
                        <button
                            onClick={handleManageBilling}
                            disabled={isRedirecting}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            {isRedirecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ExternalLink className="w-4 h-4" />
                            )}
                            Manage Billing
                        </button>
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
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        Cancel your subscription
                    </li>
                </ul>
            </div>
        </div>
    );
}
