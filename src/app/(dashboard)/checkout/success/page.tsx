'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(true);
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Simple verification delay to let webhook process
        const timer = setTimeout(() => {
            setIsVerifying(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [sessionId]);

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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome to Pro! 🎉
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Your subscription is now active. You have access to all Pro features.
                    </p>

                    <div className="space-y-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <Link
                            href="/settings/subscription"
                            className="block text-indigo-600 hover:text-indigo-800 font-medium"
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
