import { MarketingLayout } from '@/components/marketing/marketing-layout';

export default function TermsOfServicePage() {
    return (
        <MarketingLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mb-8">
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">Legal</p>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
                    <p className="text-gray-500 dark:text-gray-400">Last updated: January 2025</p>
                </div>

                <div className="prose prose-lg max-w-none">
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Welcome to SyncSEO. By accessing or using our service, you agree to be bound by these
                        Terms of Service. Please read them carefully.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">1. Acceptance of Terms</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        By creating an account or using SyncSEO, you agree to these Terms of Service and our
                        Privacy Policy. If you do not agree to these terms, please do not use our service.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">2. Description of Service</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        SyncSEO is a visual content architecture planning tool that helps you plan, organize,
                        and optimize your content strategy. Features include:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Visual content planning canvas with drag-and-drop interface</li>
                        <li>SEO scoring and optimization suggestions</li>
                        <li>Internal linking management</li>
                        <li>Team collaboration features</li>
                        <li>Content architecture templates</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">3. Account Registration</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        To use SyncSEO, you must create an account. You agree to:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Provide accurate and complete information</li>
                        <li>Maintain the security of your account credentials</li>
                        <li>Notify us immediately of any unauthorized access</li>
                        <li>Be responsible for all activities under your account</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">4. Subscription Plans and Payment</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        SyncSEO offers free and paid subscription plans. By subscribing to a paid plan:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>You authorize us to charge your payment method on a recurring basis</li>
                        <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                        <li>Prices are subject to change with notice</li>
                        <li>Refunds are available within 7 days of purchase (see our Refund Policy)</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">5. Acceptable Use</h2>
                    <p className="text-gray-600 dark:text-gray-300">You agree not to:</p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Use the service for any unlawful purpose</li>
                        <li>Attempt to gain unauthorized access to our systems</li>
                        <li>Interfere with or disrupt the service</li>
                        <li>Upload malicious code or content</li>
                        <li>Violate any applicable laws or regulations</li>
                        <li>Infringe on the intellectual property rights of others</li>
                        <li>Share your account with unauthorized users</li>
                        <li>Use automated systems to access the service without permission</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">6. Your Content</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        You retain ownership of content you create using SyncSEO. By using our service, you grant
                        us a limited license to store, display, and process your content solely to provide the service.
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        You are responsible for ensuring you have the right to use any content you upload,
                        and that your content does not violate any laws or third-party rights.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">7. Intellectual Property</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        SyncSEO and its original content, features, and functionality are owned by SyncSEO and
                        are protected by international copyright, trademark, and other intellectual property laws.
                        You may not copy, modify, distribute, or create derivative works based on our service
                        without express written permission.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">8. Termination</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        We may terminate or suspend your account at any time for violations of these terms or
                        for any other reason at our discretion. Upon termination:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Your right to use the service will immediately cease</li>
                        <li>We may delete your data after a reasonable period</li>
                        <li>You may export your data before termination if possible</li>
                    </ul>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        You may cancel your account at any time through your account settings.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">9. Disclaimer of Warranties</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        SyncSEO is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
                        express or implied. We do not guarantee that the service will be uninterrupted, secure,
                        or error-free. We make no warranties regarding the accuracy or reliability of any
                        information obtained through the service.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">10. Limitation of Liability</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        To the maximum extent permitted by law, SyncSEO shall not be liable for any indirect,
                        incidental, special, consequential, or punitive damages, including but not limited to
                        loss of profits, data, or goodwill, arising from your use of the service.
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        Our total liability for any claims arising from these terms or your use of the service
                        shall not exceed the amount you paid us in the 12 months preceding the claim.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">11. Indemnification</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        You agree to indemnify and hold harmless SyncSEO from any claims, damages, losses,
                        or expenses arising from your use of the service, your content, or your violation
                        of these terms.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">12. Changes to Terms</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        We reserve the right to modify these terms at any time. We will notify you of significant
                        changes by email or through the service. Your continued use of the service after changes
                        become effective constitutes acceptance of the new terms.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">13. Governing Law</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        These terms shall be governed by and construed in accordance with applicable laws,
                        without regard to conflict of law principles.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">14. Contact Us</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        If you have any questions about these Terms of Service, please contact us at:
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        <strong>Email:</strong> hi@syncseo.io
                    </p>
                </div>
            </div>
        </MarketingLayout>
    );
}
