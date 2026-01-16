import { MarketingLayout } from '@/components/marketing/marketing-layout';

export default function CookiePolicyPage() {
    return (
        <MarketingLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mb-8">
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">Legal</p>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Cookie Policy</h1>
                    <p className="text-gray-500 dark:text-gray-400">Last updated: January 2025</p>
                </div>

                <div className="prose prose-lg max-w-none">
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        This Cookie Policy explains how SyncSEO uses cookies and similar technologies
                        when you visit our website or use our service.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">What Are Cookies?</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Cookies are small text files that are stored on your device (computer, tablet, or mobile)
                        when you visit a website. They help websites remember your preferences and understand
                        how you interact with the site.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Types of Cookies We Use</h2>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Essential Cookies</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        These cookies are necessary for the website to function properly. They enable core
                        functionality such as:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>User authentication and session management</li>
                        <li>Security features</li>
                        <li>Remembering your login status</li>
                        <li>Load balancing to ensure the website remains available</li>
                    </ul>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        <strong>These cookies cannot be disabled</strong> as the service would not function without them.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Analytics Cookies</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        We use Google Analytics to understand how visitors interact with our website. These cookies collect:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Pages visited and time spent on each page</li>
                        <li>How you arrived at our website</li>
                        <li>Links clicked</li>
                        <li>Browser and device information</li>
                    </ul>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        This information helps us improve our website and service. Google Analytics data is
                        aggregated and anonymous.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Functional Cookies</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        These cookies remember choices you make to improve your experience:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>Your preferred settings</li>
                        <li>Previously viewed content</li>
                        <li>Form information you&apos;ve entered</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Third-Party Cookies</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Some cookies are placed by third-party services that appear on our pages:
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mt-4">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-2 text-gray-900 dark:text-white font-semibold">Service</th>
                                    <th className="text-left py-2 text-gray-900 dark:text-white font-semibold">Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                    <td className="py-3 text-gray-600 dark:text-gray-300">Google Analytics</td>
                                    <td className="py-3 text-gray-600 dark:text-gray-300">Website analytics and usage statistics</td>
                                </tr>
                                <tr>
                                    <td className="py-3 text-gray-600 dark:text-gray-300">Stripe</td>
                                    <td className="py-3 text-gray-600 dark:text-gray-300">Payment processing and fraud prevention</td>
                                </tr>
                                <tr>
                                    <td className="py-3 text-gray-600 dark:text-gray-300">Supabase</td>
                                    <td className="py-3 text-gray-600 dark:text-gray-300">Authentication and session management</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Managing Cookies</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        You can control and manage cookies in several ways:
                    </p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Browser Settings</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        Most browsers allow you to control cookies through their settings. You can:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li>View what cookies are stored and delete them individually</li>
                        <li>Block third-party cookies</li>
                        <li>Block all cookies</li>
                        <li>Delete all cookies when you close your browser</li>
                    </ul>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        Note: Blocking all cookies may affect your experience on our website and prevent
                        some features from working properly.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Google Analytics Opt-Out</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        You can opt out of Google Analytics by installing the{' '}
                        <a
                            href="https://tools.google.com/dlpage/gaoptout"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            Google Analytics Opt-out Browser Add-on
                        </a>.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Cookie Retention</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Different cookies have different retention periods:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                        <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                        <li><strong>Persistent cookies:</strong> Remain until they expire or you delete them (typically 30 days to 2 years)</li>
                        <li><strong>Google Analytics cookies:</strong> Up to 2 years</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Updates to This Policy</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        We may update this Cookie Policy from time to time to reflect changes in our practices
                        or for other operational, legal, or regulatory reasons. We encourage you to review
                        this policy periodically.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Contact Us</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        If you have any questions about our use of cookies, please contact us at:
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        <strong>Email:</strong> hi@syncseo.io
                    </p>
                </div>
            </div>
        </MarketingLayout>
    );
}
