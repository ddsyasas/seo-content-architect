'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, CheckCircle } from 'lucide-react';

function SignupForm() {
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const supabase = createClient();

            // Get the base URL for redirect
            const baseUrl = window.location.origin;
            const emailRedirectTo = `${baseUrl}${redirectTo}`;

            const { error, data } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    emailRedirectTo,
                },
            });

            if (error) {
                setError(error.message);
                return;
            }

            // Check if email confirmation is required
            if (data?.user?.identities?.length === 0) {
                setError('An account with this email already exists.');
                return;
            }

            // Add user to Brevo (non-blocking - don't wait or show errors)
            try {
                fetch('/api/newsletter/subscribe-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name: fullName }),
                }).catch(() => {
                    // Silently fail - don't block signup
                });
            } catch {
                // Silently fail - Brevo integration shouldn't break signup
            }

            // Show confirmation message
            setShowConfirmation(true);
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (showConfirmation) {
        return (
            <Card className="shadow-xl border-0 dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-8 pb-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-green-900/30">
                            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">Check your email</h1>
                        <p className="text-gray-600 mb-6 dark:text-gray-300">
                            We've sent a confirmation link to<br />
                            <strong className="text-gray-900 dark:text-white">{email}</strong>
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 dark:bg-gray-900/50 dark:border dark:border-gray-700">
                            <div className="flex items-start gap-3 text-left">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p className="font-medium text-gray-900 mb-1 dark:text-gray-200">Next steps:</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Open the email we just sent you</li>
                                        <li>Click the confirmation link</li>
                                        <li>You'll be signed in automatically</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Didn't receive the email?{' '}
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="text-indigo-600 hover:text-indigo-700 font-medium dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                Try again
                            </button>
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-xl border-0 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-8 pb-6">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Start mapping your content architecture</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Full name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="name"
                    />

                    <Input
                        label="Email address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        helperText="Must be at least 6 characters"
                    />

                    <Input
                        label="Confirm password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        Create account
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium dark:text-indigo-400 dark:hover:text-indigo-300">
                        Sign in
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-xl h-96 dark:bg-gray-800" />}>
            <SignupForm />
        </Suspense>
    );
}
