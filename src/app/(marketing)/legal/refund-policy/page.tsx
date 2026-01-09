import { MarketingLayout } from '@/components/marketing/marketing-layout';
import Link from 'next/link';

export default function RefundPolicyPage() {
    return (
        <MarketingLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mb-8">
                    <p className="text-sm font-medium text-indigo-600 mb-2">Legal</p>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
                    <p className="text-gray-500">Last updated: January 2025</p>
                </div>

                <div className="prose prose-lg max-w-none">
                    <p className="text-gray-600 text-lg">
                        We want you to be completely satisfied with SyncSEO. This Refund Policy outlines
                        our guidelines for refunds on paid subscriptions.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7-Day Money-Back Guarantee</h2>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-4">
                        <p className="text-green-800 font-medium">
                            We offer a full refund within 7 days of your initial purchase, no questions asked.
                        </p>
                    </div>
                    <p className="text-gray-600 mt-4">
                        If you&apos;re not satisfied with SyncSEO for any reason, simply contact us within 7 days
                        of your purchase date, and we&apos;ll process a full refund to your original payment method.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Eligibility</h2>
                    <p className="text-gray-600">To be eligible for a refund, you must:</p>
                    <ul className="list-disc pl-6 text-gray-600 space-y-2">
                        <li>Request the refund within 7 days of your initial subscription purchase</li>
                        <li>Be a first-time subscriber (refund applies to first purchase only)</li>
                        <li>Contact us via email at hi@syncseo.io</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">What&apos;s Covered</h2>
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="font-semibold text-green-900 mb-3">Eligible for Refund</h3>
                            <ul className="space-y-2 text-green-800">
                                <li>Initial Pro plan subscription</li>
                                <li>Initial Agency plan subscription</li>
                                <li>Plan upgrades (within 7 days of upgrade)</li>
                            </ul>
                        </div>
                        <div className="bg-red-50 rounded-lg p-6">
                            <h3 className="font-semibold text-red-900 mb-3">Not Eligible for Refund</h3>
                            <ul className="space-y-2 text-red-800">
                                <li>Renewal payments after the first period</li>
                                <li>Requests made after 7 days</li>
                                <li>Accounts terminated for policy violations</li>
                            </ul>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">How to Request a Refund</h2>
                    <p className="text-gray-600">To request a refund:</p>
                    <ol className="list-decimal pl-6 text-gray-600 space-y-3 mt-4">
                        <li>
                            <strong>Send an email</strong> to hi@syncseo.io with the subject line &quot;Refund Request&quot;
                        </li>
                        <li>
                            <strong>Include</strong> the email address associated with your SyncSEO account
                        </li>
                        <li>
                            <strong>We&apos;ll process</strong> your refund within 5-7 business days
                        </li>
                    </ol>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Refund Processing</h2>
                    <p className="text-gray-600">
                        Once your refund is approved:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 space-y-2">
                        <li>The refund will be credited to your original payment method</li>
                        <li>Processing typically takes 5-7 business days</li>
                        <li>Your account will be downgraded to the Free plan</li>
                        <li>You&apos;ll retain access to your data on the Free plan</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Cancellation vs. Refund</h2>
                    <p className="text-gray-600">
                        <strong>Cancellation</strong> and <strong>refund</strong> are different:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                        <li>
                            <strong>Cancellation:</strong> Stops future billing. You keep access until your
                            current billing period ends.
                        </li>
                        <li>
                            <strong>Refund:</strong> Returns your payment. Your premium access ends immediately
                            upon refund processing.
                        </li>
                    </ul>
                    <p className="text-gray-600 mt-4">
                        You can cancel your subscription anytime from your{' '}
                        <Link href="/settings" className="text-indigo-600 hover:text-indigo-700">
                            account settings
                        </Link>.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Free Plan</h2>
                    <p className="text-gray-600">
                        Remember, SyncSEO offers a generous Free plan that you can use indefinitely.
                        We encourage you to try the Free plan before purchasing to ensure SyncSEO
                        meets your needs.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Questions?</h2>
                    <p className="text-gray-600">
                        If you have any questions about our refund policy or need assistance, please
                        don&apos;t hesitate to contact us:
                    </p>
                    <p className="text-gray-600 mt-2">
                        <strong>Email:</strong> hi@syncseo.io
                    </p>
                </div>
            </div>
        </MarketingLayout>
    );
}
