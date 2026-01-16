import { MarketingLayout } from '@/components/marketing/marketing-layout';

export default function PrivacyPolicyPage() {
    return (
        <MarketingLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mb-8">
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">Legal</p>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
                    <p className="text-gray-500 dark:text-gray-400">Last updated: January 2025</p>
                </div>

                <div className="prose prose-lg max-w-none">
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        At SyncSEO, we take your privacy seriously. This Privacy Policy explains how we collect,
                        use, disclose, and safeguard your information when you use our service.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Information We Collect</h2>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Personal Information</h3>
                    <p className="text-gray-600 dark:text-gray-300">When you create an account, we collect:</p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Email address</li>
                        <li>Name (if provided)</li>
                        <li>Profile information you choose to add</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Payment Information</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        When you subscribe to a paid plan, payment processing is handled securely by Stripe.
                        We do not store your credit card details on our servers. Stripe may collect payment
                        information in accordance with their privacy policy.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Usage Data</h3>
                    <p className="text-gray-600 dark:text-gray-300">We automatically collect certain information when you use SyncSEO:</p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Browser type and version</li>
                        <li>Pages visited and features used</li>
                        <li>Time and date of your visit</li>
                        <li>Device information</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">How We Use Your Information</h2>
                    <p className="text-gray-600 dark:text-gray-300">We use the information we collect to:</p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Provide, maintain, and improve our services</li>
                        <li>Process transactions and send related information</li>
                        <li>Send you technical notices, updates, and support messages</li>
                        <li>Respond to your comments, questions, and requests</li>
                        <li>Monitor and analyze trends, usage, and activities</li>
                        <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Analytics</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        We use Google Analytics to help us understand how visitors interact with our website.
                        Google Analytics collects information such as how often users visit the site, what pages
                        they visit, and what other sites they used prior to coming to our site. We use this
                        information to improve our service. Google Analytics collects the IP address assigned
                        to you on the date you visit the site, but not your name or other identifying information.
                        You can opt out of Google Analytics by installing the Google Analytics opt-out browser add-on.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Data Storage and Security</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Your data is stored securely using Supabase infrastructure. We implement appropriate
                        technical and organizational measures to protect your personal information against
                        unauthorized access, alteration, disclosure, or destruction.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Data Sharing</h2>
                    <p className="text-gray-600 dark:text-gray-300">We do not sell your personal information. We may share your information with:</p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li><strong>Service Providers:</strong> Third-party companies that help us operate our service (e.g., Stripe for payments, Supabase for data storage)</li>
                        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Your Rights</h2>
                    <p className="text-gray-600 dark:text-gray-300">You have the right to:</p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Access, update, or delete your personal information</li>
                        <li>Export your data</li>
                        <li>Opt out of marketing communications</li>
                        <li>Request information about how your data is processed</li>
                    </ul>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        To exercise these rights, please contact us at hi@syncseo.io.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Data Retention</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        We retain your personal information for as long as your account is active or as needed
                        to provide you services. If you delete your account, we will delete your personal
                        information within 30 days, except where we are required to retain it for legal purposes.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Children&apos;s Privacy</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        SyncSEO is not intended for children under 13 years of age. We do not knowingly collect
                        personal information from children under 13.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Changes to This Policy</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        We may update this Privacy Policy from time to time. We will notify you of any changes
                        by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Contact Us</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        If you have any questions about this Privacy Policy, please contact us at:
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        <strong>Email:</strong> hi@syncseo.io
                    </p>
                </div>
            </div>
        </MarketingLayout>
    );
}
