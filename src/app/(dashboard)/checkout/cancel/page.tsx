'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function CheckoutCancelPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-10 h-10 text-gray-400" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Payment Cancelled
                    </h1>

                    <p className="text-gray-600 mb-8">
                        No worries! Your payment was not processed. You can try again whenever you&apos;re ready.
                    </p>

                    <div className="space-y-4">
                        <Link
                            href="/pricing"
                            className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            View Plans
                        </Link>

                        <Link
                            href="/dashboard"
                            className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Questions? Contact us at support@seoarchitect.com
                </p>
            </div>
        </div>
    );
}
